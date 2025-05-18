"use client";

export default function PostList({ posts, onSelect }) {
  if (posts.length === 0) {
    return <p className="text-center text-gray-400">작성된 글이 없습니다.</p>;
  }

  return (
    <div className="w-full overflow-y-auto px-2 py-4 custom-scrollbar space-y-1">
      {posts.map((post) => (
        <div
          key={post._id}
          className="bg-white p-3 rounded shadow cursor-pointer"
          onClick={() => onSelect(post)}
        >
          <h4 className="font-bold text-sm text-black truncate">
            {post.isNotice && "📌 "}
            {post.isVote && "🗳️ "}
            {post.title}
          </h4>
        </div>
      ))}
    </div>
  );
}
