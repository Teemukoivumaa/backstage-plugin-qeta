import { PostsResponse, PostType } from '@drodil/backstage-plugin-qeta-common';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../utils';
import { Progress, WarningPanel } from '@backstage/core-components';
import { NoPostsCard } from '../PostsContainer/NoPostsCard';
import { Box, Grid } from '@material-ui/core';
import { PostsGridItem } from './PostsGridItem';
import { Pagination } from '@material-ui/lab';

export const PostsGridContent = (props: {
  loading: boolean;
  error: any;
  response?: PostsResponse;
  entity?: string;
  tags?: string[];
  showNoQuestionsBtn?: boolean;
  entityPage?: boolean;
  type?: PostType;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
}) => {
  const {
    loading,
    error,
    response,
    entity,
    showNoQuestionsBtn = true,
    entityPage,
    tags,
    type,
    onPageChange,
    page,
    pageCount,
  } = props;
  const [initialLoad, setInitialLoad] = useState(true);
  const { t } = useTranslation();
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!initialLoad) {
      setInitialLoad(false);
    }
  }, [initialLoad, loading]);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView();
    }
    onPageChange(value);
  };

  if (loading && initialLoad) {
    return <Progress />;
  }

  const itemType = (type ?? 'post') as any;

  if (error || response === undefined) {
    return (
      <WarningPanel
        severity="error"
        title={t('postsList.errorLoading', { itemType })}
      >
        {error?.message}
      </WarningPanel>
    );
  }

  if (initialLoad && (!response.posts || response.posts.length === 0)) {
    return (
      <NoPostsCard
        showNoPostsBtn={showNoQuestionsBtn}
        entity={entity}
        entityPage={entityPage}
        tags={tags}
        type={type}
      />
    );
  }

  return (
    <div ref={gridRef}>
      <Box sx={{ mt: 2 }} className="qetaPostsGrid">
        <Grid
          container
          direction="row"
          alignItems="stretch"
          style={{ marginTop: '1rem' }}
        >
          {response.posts.map(p => {
            return (
              <Grid item xs={12} xl={6} key={p.id}>
                <PostsGridItem post={p} type={type} entity={entity} />
              </Grid>
            );
          })}
        </Grid>
        <Grid container justifyContent="center" style={{ marginTop: '2rem' }}>
          <Pagination
            page={page}
            onChange={handlePageChange}
            count={pageCount}
            size="large"
            variant="outlined"
            className="qetaPostListPagination"
            showFirstButton
            showLastButton
          />
        </Grid>
      </Box>
    </div>
  );
};
