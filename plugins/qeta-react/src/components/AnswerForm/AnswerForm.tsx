import { WarningPanel } from '@backstage/core-components';
import { useCallback, useEffect, useState } from 'react';
import { configApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
import {
  AnswerResponse,
  PostResponse,
  qetaCreateAnswerPermission,
} from '@drodil/backstage-plugin-qeta-common';
import { Controller, useForm } from 'react-hook-form';
import { MarkdownEditor } from '../MarkdownEditor/MarkdownEditor';
import { PostAnonymouslyCheckbox } from '../PostAnonymouslyCheckbox/PostAnonymouslyCheckbox';
import { useConfirmNavigationIfEdited } from '../../utils/utils';
import { qetaApiRef } from '../../api';
import { Box, Button, Typography, useTheme } from '@material-ui/core';
import { OptionalRequirePermission } from '../Utility/OptionalRequirePermission';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { qetaTranslationRef } from '../../translation.ts';
import { useIdentityApi, useIsModerator } from '../../hooks';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { EntitiesInput } from '../PostForm/EntitiesInput';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';

type AnswerFormData = {
  postId: number;
  answer: string;
  images: number[];
  author?: Entity;
  anonymous?: boolean;
};

const getDefaultValues = (postId: number): AnswerFormData => {
  return { postId, answer: '', images: [] };
};

export const AnswerForm = (props: {
  post: PostResponse;
  onPost: (answer: AnswerResponse) => void;
  id?: number;
}) => {
  const { post, onPost, id } = props;
  const [values, setValues] = useState<AnswerFormData>(
    getDefaultValues(post.id),
  );
  const analytics = useAnalytics();
  const isModerator = useIsModerator();
  const { value: identity } = useIdentityApi(
    api => api.getBackstageIdentity(),
    [],
  );
  const theme = useTheme();
  const [error, setError] = useState(false);
  const [posting, setPosting] = useState(false);
  const catalogApi = useApi(catalogApiRef);
  const [images, setImages] = useState<number[]>([]);
  const [edited, setEdited] = useState(false);
  const qetaApi = useApi(qetaApiRef);
  const configApi = useApi(configApiRef);
  const allowAnonymouns = configApi.getOptionalBoolean('qeta.allowAnonymous');
  const { t } = useTranslationRef(qetaTranslationRef);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AnswerFormData>({
    values,
    defaultValues: getDefaultValues(post.id),
  });

  const postAnswer = (data: AnswerFormData) => {
    setPosting(true);

    if (id) {
      qetaApi
        .updateAnswer(id, {
          postId: post.id,
          answer: data.answer,
          author: data.author ? stringifyEntityRef(data.author) : undefined,
          images,
        })
        .then(a => {
          if (!a || !('id' in a)) {
            setError(true);
            return;
          }
          setEdited(false);
          analytics.captureEvent('edit', 'answer');
          reset();
          onPost(a);
        })
        .catch(_e => setError(true))
        .finally(() => setPosting(false));
      return;
    }
    // http://localhost:7007/api/qeta/attachments/36e551b1-3be7-479a-8942-b7018434e710
    qetaApi
      .postAnswer({
        postId: post.id,
        answer: data.answer,
        images,
        anonymous: data.anonymous,
      })
      .then(a => {
        if (!a || !('id' in a)) {
          setError(true);
          return;
        }
        setEdited(false);
        analytics.captureEvent('post', 'answer');
        reset();
        onPost(a);
      })
      .catch(_e => setError(true))
      .finally(() => setPosting(false));
  };

  useEffect(() => {
    if (id) {
      qetaApi.getAnswer(post.id, id).then(a => {
        if ('content' in a) {
          setValues({ postId: post.id, answer: a.content, images: a.images });
          setImages(a.images);
          catalogApi.getEntityByRef(a.author).then(data => {
            if (data) {
              setValues(v => {
                return { ...v, author: data };
              });
            }
          });
        } else {
          setError(true);
        }
      });
    }
  }, [catalogApi, id, post, qetaApi]);

  useEffect(() => {
    if (!id && identity?.userEntityRef) {
      catalogApi.getEntityByRef(identity.userEntityRef).then(data => {
        if (data) {
          setValues(v => {
            return { ...v, author: data };
          });
        }
      });
    }
  }, [catalogApi, id, identity]);

  useEffect(() => {
    reset(values);
  }, [values, reset]);

  useConfirmNavigationIfEdited(edited);

  const onImageUpload = useCallback(
    (imageId: number) => {
      setImages(prevImages => [...prevImages, imageId]);
    },
    [setImages],
  );

  return (
    <OptionalRequirePermission
      permission={qetaCreateAnswerPermission}
      errorPage={<></>}
    >
      <form
        onSubmit={handleSubmit(postAnswer)}
        onChange={() => {
          setEdited(true);
        }}
      >
        <Typography variant="h6">Your answer</Typography>
        {error && (
          <WarningPanel severity="error" title={t('answerForm.errorPosting')} />
        )}
        <Controller
          control={control}
          defaultValue=""
          rules={{
            required: true,
          }}
          render={({ field: { onChange, value } }) => (
            <MarkdownEditor
              value={value}
              onChange={onChange}
              height={200}
              error={'answer' in errors}
              placeholder={t('answerForm.contentInput.placeholder')}
              onImageUpload={onImageUpload}
              answerId={id ? Number(id) : undefined}
            />
          )}
          name="answer"
        />
        {isModerator && id && (
          <Box mt={1} mb={1}>
            <Controller
              control={control}
              render={({ field, fieldState: { error: authorError } }) => {
                return (
                  <EntitiesInput
                    label={t('postForm.authorInput.label')}
                    placeholder={t('postForm.authorInput.placeholder')}
                    hideHelpText
                    multiple={false}
                    kind={['User']}
                    required
                    {...field}
                    error={authorError}
                  />
                );
              }}
              name="author"
            />
          </Box>
        )}
        {allowAnonymouns && !id && (
          <PostAnonymouslyCheckbox
            control={control}
            label={t('anonymousCheckbox.answerAnonymously')}
          />
        )}
        <Button
          variant="outlined"
          type="submit"
          color="primary"
          disabled={posting || isSubmitting}
          style={{ marginTop: id ? theme.spacing(1) : '0' }}
        >
          {posting || isSubmitting ? (
            <span>
              {t('answerForm.submitting')}{' '}
              <span className="spinner-border spinner-border-sm" />
            </span>
          ) : (
            t(
              id
                ? 'answerForm.submit.existingAnswer'
                : 'answerForm.submit.newAnswer',
            )
          )}
        </Button>
      </form>
    </OptionalRequirePermission>
  );
};
