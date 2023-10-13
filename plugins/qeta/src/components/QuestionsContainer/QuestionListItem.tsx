import { QuestionResponse } from '../../api';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
} from '@material-ui/core';
import { Link } from '@backstage/core-components';
import React from 'react';
// @ts-ignore
import RelativeTime from 'react-relative-time';
import DOMPurify from 'dompurify';
import {
  formatEntityName,
  removeMarkdownFormatting,
  truncate,
} from '../../utils/utils';
import { TagsAndEntities } from '../QuestionPage/TagsAndEntities';
import { useRouteRef } from '@backstage/core-plugin-api';
import { questionRouteRef, userRouteRef } from '../../routes';

export interface QuestionListItemProps {
  question: QuestionResponse;
  entity?: string;
}

export const QuestionListItem = (props: QuestionListItemProps) => {
  const { question, entity } = props;
  const questionRoute = useRouteRef(questionRouteRef);
  const userRoute = useRouteRef(userRouteRef);
  const theme = useTheme();

  return (
    <Card className="qetaQuestionListItem">
      <CardContent>
        <Grid container justifyContent="space-between">
          <Grid item xs={12}>
            <Typography variant="h5" component="div">
              <Link
                to={
                  entity
                    ? `${questionRoute({
                        id: question.id.toString(10),
                      })}?entity=${entity}`
                    : questionRoute({ id: question.id.toString(10) })
                }
                className="qetaQuestionListItemQuestionBtn"
              >
                {question.title}
              </Link>
            </Typography>
          </Grid>
          <Grid item xs={12} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <Typography
              variant="caption"
              noWrap
              component="div"
              className="qetaQuestionListItemContent"
            >
              {DOMPurify.sanitize(
                truncate(removeMarkdownFormatting(question.content), 150),
              )}
            </Typography>
          </Grid>

          <Grid item>
            <Typography
              variant="body2"
              display="block"
              className="qetaQuestionListItemAuthor"
            >
              By{' '}
              <Link to={`${userRoute()}/${question.author}`}>
                {formatEntityName(question.author)}
              </Link>{' '}
              <RelativeTime
                value={question.created}
                titleFormat="YYYY/MM/DD HH:mm"
              />
            </Typography>
            <Typography
              variant="caption"
              display="inline"
              gutterBottom
              className="qetaQuestionListItemScore"
            >
              Score: {question.score} {' | '}
            </Typography>
            <Typography
              variant="caption"
              className={`qetaQuestionListItemAnswers ${
                question.correctAnswer
                  ? 'qetaQuestionListItemCorrectAnswer'
                  : 'quetaQuestionListItemNoCorrectAnswer'
              }`}
              style={{
                color: question.correctAnswer
                  ? theme.palette.success.main
                  : undefined,
              }}
              display="inline"
              gutterBottom
            >
              Answers: {question.answersCount}
            </Typography>
            <Typography
              variant="caption"
              display="inline"
              gutterBottom
              className="qetaQuestionListItemViews"
            >
              {' | '} Views: {question.views}
            </Typography>
          </Grid>
          <Grid item>
            <TagsAndEntities question={question} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
