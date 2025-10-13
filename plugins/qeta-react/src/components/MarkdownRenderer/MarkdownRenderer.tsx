import { Children, createElement, PropsWithChildren, useEffect } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { MarkdownHooks } from 'react-markdown';
import {
  a11yDark,
  a11yLight,
} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core';
import {
  findEntityMentions,
  findTagMentions,
} from '@drodil/backstage-plugin-qeta-common';
import gfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeToc, { HeadingNode, TextNode } from '@jsdevtools/rehype-toc';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { useIsDarkTheme } from '../../hooks/useIsDarkTheme';
import { BackstageOverrides } from '@backstage/core-components';
import LinkIcon from '@material-ui/icons/Link';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { qetaTranslationRef } from '../../translation.ts';
import { Variant } from '@material-ui/core/styles/createTypography';
import GithubSlugger from 'github-slugger';
import { HtmlElementNode } from '@jsdevtools/rehype-toc/lib/types';
import { find } from 'unist-util-find';
import { TagChip } from '../TagsAndEntities/TagChip';
import { useQetaExtensions } from '../ExtensionContext/ExtensionContext';

const slugger = new GithubSlugger();

export type QetaMarkdownContentClassKey =
  | 'markdown'
  | 'header'
  | 'tocHeader'
  | 'toc'
  | 'tocList'
  | 'tocListItem'
  | 'tocLink';

const useStyles = makeStyles(
  theme => {
    const overrides = theme.overrides as BackstageOverrides;
    return {
      markdown: {
        lineHeight: 1.75,
        '& p': {
          ...theme.typography?.body1,
          margin: '0 0 1em 0',
          wordBreak: 'break-word',
        },
        '& h1': {
          ...theme.typography?.h1,
          marginBottom: 2,
          marginTop: '1.5em',
        },
        '& h2': {
          ...theme.typography?.h2,
          marginBottom: 2,
          marginTop: '1.2em',
        },
        '& h3': {
          ...theme.typography?.h3,
          marginBottom: 2,
          marginTop: '1em',
        },
        '& h4': {
          ...theme.typography?.h4,
          marginBottom: 2,
          marginTop: '0.8em',
        },
        '& h5': {
          ...theme.typography?.h5,
          marginBottom: 2,
          marginTop: '0.7em',
        },
        '& h6': {
          ...theme.typography?.h6,
          marginBottom: 2,
          marginTop: '0.6em',
        },
        '& table': {
          borderCollapse: 'collapse',
          border: `1px solid ${theme.palette.border}`,
        },
        '& th, & td': {
          border: `1px solid ${theme.palette.border}`,
          padding: theme.spacing(1),
        },
        '& td': {
          wordBreak: 'break-word',
          overflow: 'hidden',
          verticalAlign: 'middle',
          lineHeight: '1',
          margin: 0,
          padding: theme.spacing(3, 2, 3, 2.5),
          borderBottom: 0,
        },
        '& th': {
          backgroundColor: theme.palette.background.paper,
        },
        '& tr': {
          backgroundColor: theme.palette.background.paper,
        },
        '& tr:nth-child(odd)': {
          backgroundColor: theme.palette.background.default,
        },
        '& a': {
          color: theme.palette.link,
        },
        '& img': {
          maxWidth: '100%',
        },
        '& code': {
          fontFamily: 'Courier New,Courier,monospace',
          fontStyle: 'normal',
          display: 'block',
          width: '100%',
          overflowX: 'auto',
          borderRadius: 4,
          padding: '0.2em 0.4em',
        },
        '& em': {
          fontStyle: 'italic !important',
        },
        '& ol': {
          listStyle: 'decimal',
          marginLeft: '2em',
          marginBottom: '1em',
          marginTop: '1em',
        },
        '& ul': {
          listStyle: 'disc',
          marginLeft: '2em',
          marginBottom: '1em',
          marginTop: '1em',
        },
        '& blockquote': {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          padding: '1em 1.5em',
          margin: '1.5em 0',
          color: theme.palette.text.secondary,
          borderLeft: `4px solid ${theme.palette.divider}`,
        },
        '& li': {
          marginTop: '0.5em',
        },
        '& *:first-child': {
          marginTop: 0,
        },
        '& *:last-child': {
          marginBottom: 0,
        },
        '& path': {
          stroke: `${theme.palette.text.primary} !important`,
        },
        ...(overrides?.BackstageMarkdownContent ?? {}),
      },
      codeBlockContainer: {
        position: 'relative',
        '& .copyCodeButton': {
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        },
        '&:hover .copyCodeButton': {
          opacity: 1,
          pointerEvents: 'auto',
        },
      },
      header: {
        '& .anchor-link': {
          display: 'none',
          marginLeft: '0.5em',
        },
        '&:hover .anchor-link': {
          display: 'inline-block',
        },
      },
      tocHeader: {
        marginTop: '0.5em',
        marginBottom: 0,
      },
      toc: {
        marginTop: '0.5em',
        marginLeft: '0.2em',
        paddingBottom: '1em',
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      tocList: {
        marginLeft: '0 !important',
        marginTop: '0.5em !important',
        paddingInlineStart: '1em',
        counterReset: 'item',
      },
      tocListItem: {
        display: 'block',
        '&:before': {
          content: 'counters(item, ".") " "',
          counterIncrement: 'item',
        },
      },
      tocLink: {
        color: theme.palette.link,
      },
    };
  },
  { name: 'QetaMarkdownContent' },
);

const flatten = (text: string, child: any): string => {
  if (!child) return text;

  return typeof child === 'string'
    ? text + child
    : Children.toArray(child.props.children).reduce(flatten, text);
};

export const MarkdownRenderer = (props: {
  content: string;
  className?: string;
  showToc?: boolean;
  useBlankLinks?: boolean;
}) => {
  const { content, className: mainClassName, showToc, useBlankLinks } = props;
  const darkTheme = useIsDarkTheme();
  const { t } = useTranslationRef(qetaTranslationRef);
  const classes = useStyles();
  const alertApi = useApi(alertApiRef);
  slugger.reset();

  const copyToClipboard = (slug: string) => {
    const url = new URL(window.location.href);
    url.hash = `#${slug}`;
    window.navigator.clipboard.writeText(url.toString());
    alertApi.post({
      message: t('link.copied'),
      severity: 'info',
      display: 'transient',
    });
  };

  const copyCodeToClipboard = (code: string) => {
    window.navigator.clipboard.writeText(code);
    alertApi.post({
      message: t('code.copied'),
      severity: 'info',
      display: 'transient',
    });
  };

  const headingRenderer = (
    hProps: PropsWithChildren<{ node: { tagName: string } }>,
  ) => {
    const { node, children } = hProps;
    const childrenArray = Children.toArray(children);
    const text = childrenArray.reduce(flatten, '');
    const slug = slugger.slug(text);
    const link = (
      <Tooltip title={t('link.aria')}>
        <IconButton
          aria-label={t('link.aria')}
          onClick={() => copyToClipboard(slug)}
          size="small"
          className="anchor-link"
        >
          <LinkIcon />
        </IconButton>
      </Tooltip>
    );
    return (
      <>
        {createElement(
          Typography,
          {
            variant: node.tagName as Variant,
            id: slug,
            className: classes.header,
          },
          [children, link],
        )}
      </>
    );
  };

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const id = window.location.hash.slice(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);

  const extensions = useQetaExtensions();

  const rehypePlugins: import('unified').PluggableList = [[rehypeSlug]];
  if (showToc) {
    rehypePlugins.push([
      rehypeToc,
      {
        cssClasses: {
          toc: classes.toc,
          list: classes.tocList,
          listItem: classes.tocListItem,
          link: classes.tocLink,
        },
        customizeTOC: (toc: HtmlElementNode) => {
          const listItems = find(toc, { tagName: 'li' });
          if (!toc.children || !listItems) {
            return false;
          }
          const tocHeader: TextNode = {
            type: 'text',
            value: t('markdown.toc'),
          };
          const heading: HeadingNode = {
            type: 'element',
            tagName: 'h3',
            properties: {},
            children: [tocHeader],
          };

          toc.children.unshift(heading);
          return toc;
        },
      },
    ]);
  }

  return (
    <div className={`${classes.markdown} ${mainClassName ?? ''}`.trim()}>
      <MarkdownHooks
        remarkPlugins={[gfm, ...(extensions.remarkPlugins ?? [])]}
        rehypePlugins={[...rehypePlugins, ...(extensions.rehypePlugins ?? [])]}
        components={{
          h1: (p: any) => headingRenderer(p),
          h2: (p: any) => headingRenderer(p),
          h3: (p: any) => headingRenderer(p),
          h4: (p: any) => headingRenderer(p),
          h5: (p: any) => headingRenderer(p),
          h6: (p: any) => headingRenderer(p),
          p: (p: any) => {
            const { children } = p;
            const arr = Children.toArray(children);
            const formatted = arr.map((child: any) => {
              if (typeof child !== 'string') {
                return child;
              }
              const userMentions = findEntityMentions(child);
              const tagMentions = findTagMentions(child);
              if (userMentions.length === 0 && tagMentions.length === 0) {
                return child;
              }

              return child.split(' ').map((word: string) => {
                const userMention = userMentions.find(m => word === m);
                if (userMention) {
                  return (
                    <>
                      <EntityRefLink
                        entityRef={userMention.slice(1)}
                        hideIcon
                        target={useBlankLinks ? '_blank' : undefined}
                      />{' '}
                    </>
                  );
                }

                const tagMention = tagMentions.find(m => word === m);
                if (tagMention) {
                  return (
                    <TagChip
                      tag={tagMention.slice(1)}
                      style={{ marginBottom: 0 }}
                      useHref={useBlankLinks}
                      key={tagMention}
                    />
                  );
                }

                return <>{word} </>;
              });
            });

            return <p>{formatted}</p>;
          },
          code(p: any) {
            const { children, className, node, ...rest } = p;
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            return match ? (
              <div className={classes.codeBlockContainer}>
                <SyntaxHighlighter
                  {...rest}
                  PreTag="div"
                  language={match[1]}
                  style={darkTheme ? a11yDark : a11yLight}
                  showLineNumbers
                >
                  {codeString}
                </SyntaxHighlighter>
                <Tooltip title={t('code.aria')}>
                  <IconButton
                    aria-label={t('code.aria')}
                    size="small"
                    className="copyCodeButton"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                    }}
                    onClick={() => copyCodeToClipboard(codeString)}
                  >
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </MarkdownHooks>
    </div>
  );
};
