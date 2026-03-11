import { Component, ReactNode } from 'react';
import i18n from '@/i18n';

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
          <p className="text-sm text-muted-foreground">{i18n.t('postError.loadError')}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
