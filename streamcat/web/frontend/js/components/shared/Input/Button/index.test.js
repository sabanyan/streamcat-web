import React from 'react'
import renderer from 'react-test-renderer'
import Button from './index'

describe('Button', () => {
  test('Button', () => {
    const button = renderer.create(
      <Button disabled={false} icon={'attachment'} danger={false}>アップロード</Button>
    ).toJSON();
    expect(button).toMatchSnapshot();
  });
});
