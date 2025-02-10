import React from "react";

const CommitCard = ({ repo, created_at, payload }: any) => {
  const latestCommit = payload.commits?.[0];
  const repoAvatar = `https://github.com/${repo.name.split("/")[0]}.png`;

  return (
    <div className="w-full bg-gray-900 text-white p-6 rounded-lg shadow-lg border border-gray-800">
      <div className="flex items-center gap-4">
        <img
          src={repoAvatar}
          alt={repo.name}
          className="w-12 h-12 rounded-full border border-gray-700"
        />
        <div>
          <a
            href={`https://github.com/${repo.name}`}
            className="text-lg font-semibold text-blue-400 hover:underline"
          >
            {repo.name}
          </a>
          <p className="text-gray-400 text-sm">
            {new Date(created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {latestCommit && (
        <>
          <p className="mt-2 text-gray-300 text-lg">{latestCommit.message}</p>
          <a
            href={latestCommit.url}
            className="mt-3 block text-sm text-gray-500 hover:text-gray-400"
          >
            #{latestCommit.sha.slice(0, 7)}
          </a>
        </>
      )}
    </div>
  );
};

export default CommitCard;
