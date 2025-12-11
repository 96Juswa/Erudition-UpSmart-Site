'use client';

import UserInfo from './UserInfo';
import Divider from './Divider';
import Badge from './Badge';

export default function CommentItem({ comment, showDivider }) {
  const roleLabel = comment.role === 'client' ? 'Client' : 'Provider';
  const roleVariant = comment.role === 'client' ? 'neutral' : 'primary';

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserInfo
              name={comment.author.name}
              profileImageUrl={comment.author.profileImageUrl}
              trustRating={comment.author.trustRating}
            />
            <Badge
              text={roleLabel}
              variant={roleVariant}
            />
          </div>
          <span className="text-xs text-gray-500">
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>
        <p className="text-gray-800 leading-relaxed">{comment.content}</p>
      </div>

      {showDivider && <Divider orientation="horizontal" />}
    </div>
  );
}

// 🕒 Friendly Timestamp Formatter
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
