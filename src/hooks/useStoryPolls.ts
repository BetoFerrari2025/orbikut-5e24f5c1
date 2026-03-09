import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PollData {
  question: string;
  optionA: string;
  optionB: string;
}

export function useCreateStoryWithPoll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, poll, caption, linkUrl, linkLabel, musicUrl }: { file: File; poll?: PollData; caption?: string; linkUrl?: string; linkLabel?: string; musicUrl?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create story with optional caption and link
      const insertData: any = { user_id: user.id, image_url: publicUrl };
      if (caption) insertData.caption = caption;
      if (musicUrl) insertData.music_url = musicUrl;
      if (linkUrl) { insertData.link_url = linkUrl; insertData.link_label = linkLabel || 'Saiba mais'; }

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert(insertData)
        .select()
        .single();

      if (storyError) throw storyError;

      // Create poll if provided
      if (poll && story) {
        const { error: pollError } = await supabase
          .from('story_polls')
          .insert({
            story_id: story.id,
            question: poll.question,
            option_a: poll.optionA,
            option_b: poll.optionB,
          });

        if (pollError) throw pollError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useStoryPoll(storyId: string) {
  return useQuery({
    queryKey: ['story-poll', storyId],
    queryFn: async () => {
      const { data: poll, error } = await supabase
        .from('story_polls')
        .select('*')
        .eq('story_id', storyId)
        .maybeSingle();

      if (error) throw error;
      if (!poll) return null;

      // Get vote counts
      const { data: votes } = await supabase
        .from('story_poll_votes')
        .select('selected_option')
        .eq('poll_id', poll.id);

      const votesA = votes?.filter(v => v.selected_option === 'A').length ?? 0;
      const votesB = votes?.filter(v => v.selected_option === 'B').length ?? 0;
      const total = votesA + votesB;

      return {
        ...poll,
        votesA,
        votesB,
        percentA: total > 0 ? Math.round((votesA / total) * 100) : 50,
        percentB: total > 0 ? Math.round((votesB / total) * 100) : 50,
        total,
      };
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ pollId, option, storyId }: { pollId: string; option: 'A' | 'B'; storyId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('story_poll_votes')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          selected_option: option,
        });

      if (error && error.code === '23505') {
        // Already voted, that's okay
        return;
      }
      if (error) throw error;
    },
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['story-poll', storyId] });
    },
  });
}

export function useUserVote(pollId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['poll-vote', pollId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('story_poll_votes')
        .select('selected_option')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.selected_option as 'A' | 'B' | null;
    },
    enabled: !!user,
  });
}
