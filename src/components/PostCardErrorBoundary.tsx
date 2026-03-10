import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  postId: string;
}

interface State {
  hasError: boolean;
}

export class PostCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[PostCard ${this.props.postId}]`, error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card border-y md:border md:rounded-lg p-6 -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar este post</p>
        </div>
      );
    }
    return this.props.children;
  }
}
