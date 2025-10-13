import {
  CommonFilterPanelProps,
  FilterPanel,
  PostFilters,
} from '../FilterPanel/FilterPanel';
import { PostList } from './PostList';
import { AskQuestionButton } from '../Buttons/AskQuestionButton';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { TagFollowButton } from '../Buttons/TagFollowButton';
import { EntityFollowButton } from '../Buttons/EntityFollowButton';
import { CreateLinkButton, WriteArticleButton } from '../Buttons';
import { ViewToggle, ViewType } from '../ViewToggle/ViewToggle';
import { capitalize } from 'lodash';
import {
  PaginatedPostsProps,
  usePaginatedPosts,
} from '../../hooks/usePaginatedPosts';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { qetaTranslationRef } from '../../translation.ts';
import { SearchBar } from '../SearchBar/SearchBar';
import { Box, Button, Collapse, Grid, Typography } from '@material-ui/core';
import FilterList from '@material-ui/icons/FilterList';

export type PostsContainerProps = PaginatedPostsProps & {
  entity?: string;
  filterPanelProps?: CommonFilterPanelProps;
  showTypeLabel?: boolean;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
};

export const PostsContainer = (props: PostsContainerProps) => {
  const {
    type,
    tags,
    author,
    entity,
    showFilters,
    showTitle,
    title,
    favorite,
    showAskButton,
    showWriteButton,
    showLinkButton,
    showNoQuestionsBtn,
    showTypeLabel,
    view,
    onViewChange,
  } = props;
  const {
    onSearchQueryChange,
    filters,
    response,
    loading,
    error,
    setShowFilterPanel,
    showFilterPanel,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    page,
    postsPerPage,
    pageCount,
  } = usePaginatedPosts(props);
  const { t } = useTranslationRef(qetaTranslationRef);

  const itemType = capitalize(t(`common.${type ?? 'post'}`, {}));
  let shownTitle = title;
  let link = undefined;
  let btn = undefined;
  if (author) {
    shownTitle = t(`postsContainer.title.by`, { itemType });
    link = <EntityRefLink entityRef={author} hideIcon defaultKind="user" />;
  } else if (entity) {
    shownTitle = t(`postsContainer.title.about`, { itemType });
    link = <EntityRefLink entityRef={entity} />;
    btn = <EntityFollowButton entityRef={entity} />;
  } else if (tags) {
    shownTitle = `#${tags.join(', #')}`;
    if (tags.length === 1) {
      btn = <TagFollowButton tag={tags[0]} />;
    }
  } else if (favorite) {
    shownTitle = t('postsContainer.title.favorite', {
      itemType: itemType.toLowerCase(),
    });
  }

  return (
    <Box className="qetaPostsContainer">
      {(showTitle || showAskButton || showWriteButton || showLinkButton) && (
        <Box mb={3}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              {showTitle && (
                <Typography
                  variant="h5"
                  className="qetaPostsContainerTitle"
                  style={{ fontWeight: 500, paddingBottom: 2 }}
                >
                  {shownTitle} {link} {btn}
                </Typography>
              )}
            </Grid>
            <Grid item>
              {showAskButton && (
                <AskQuestionButton
                  entity={entity ?? filters.entity}
                  entityPage={entity !== undefined}
                  tags={tags}
                />
              )}
              {showWriteButton && (
                <WriteArticleButton
                  entity={entity ?? filters.entity}
                  entityPage={entity !== undefined}
                  tags={tags}
                />
              )}
              {showLinkButton && (
                <CreateLinkButton
                  entity={entity ?? filters.entity}
                  entityPage={entity !== undefined}
                  tags={tags}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      )}
      <Grid container alignItems="flex-end" justifyContent="space-between">
        <Grid item xs={12} md={4}>
          <SearchBar
            onSearch={onSearchQueryChange}
            label={t('postsContainer.search.label', {
              itemType: itemType.toLowerCase(),
            })}
            loading={loading}
          />
        </Grid>
      </Grid>
      {response && (
        <Box mt={2} mb={2}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography
                variant="h6"
                className="qetaPostsContainerQuestionCount"
                style={{ fontWeight: 500, paddingBottom: 2 }}
              >
                {t('common.posts', { count: response?.total ?? 0, itemType })}
              </Typography>
            </Grid>
            <Grid item>
              <Grid container spacing={1} alignItems="center">
                {view && onViewChange && (
                  <Grid item>
                    <ViewToggle view={view} onChange={onViewChange} />
                  </Grid>
                )}
                {(showFilters ?? true) && (
                  <Grid item>
                    <Button
                      onClick={() => {
                        setShowFilterPanel(!showFilterPanel);
                      }}
                      className="qetaPostsContainerFilterPanelBtn"
                      startIcon={<FilterList />}
                    >
                      {t('filterPanel.filterButton')}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )}
      {(showFilters ?? true) && (
        <Collapse in={showFilterPanel}>
          <FilterPanel<PostFilters>
            onChange={onFilterChange}
            filters={filters}
            type={type}
            showEntityFilter={entity === undefined}
            {...props.filterPanelProps}
          />
        </Collapse>
      )}
      <PostList
        loading={loading}
        error={error}
        response={response}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        entity={entity ?? filters.entity}
        page={page}
        pageSize={postsPerPage}
        pageCount={pageCount}
        showNoQuestionsBtn={showNoQuestionsBtn}
        entityPage={entity !== undefined}
        tags={tags ?? filters.tags}
        type={type}
        showTypeLabel={showTypeLabel}
      />
    </Box>
  );
};
