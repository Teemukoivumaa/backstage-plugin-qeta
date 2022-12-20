import React from 'react';
import { Button } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { Content, ContentHeader } from '@backstage/core-components';
// @ts-ignore
import RelativeTime from 'react-relative-time';
import { QuestionList } from '../HomePage/QuestionList';

export const TagPage = () => {
  const { tag } = useParams();
  return (
    <Content>
      <ContentHeader title={`Questions tagged [${tag}]`}>
        <Button href="/qeta">Back to questions</Button>
        <Button variant="contained" href="/qeta/ask">
          Ask question
        </Button>
      </ContentHeader>
      <QuestionList tags={[tag ?? '']} />
    </Content>
  );
};
