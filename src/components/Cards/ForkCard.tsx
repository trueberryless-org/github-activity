import React from "react";

const ForkCard = ({ repo, payload, created_at }: any) => {
  const repoAvatar = `https://github.com/${repo.name.split("/")[0]}.png`;

  return (
    <div className="w-full bg-gray-900 text-white p-6 rounded-lg shadow-lg border border-gray-800">
      <div className="flex items-center gap-4">
        <img src={repoAvatar} alt={repo.name} className="w-12 h-12 rounded-full border border-gray-700" />
        <div>
          <p className="text-lg">
            Forked{" "}
            <a href={repo.url} className="text-blue-400 hover:underline">
              {repo.name}
            </a>
          </p>
          <p className="text-gray-400 text-sm">{new Date(created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ForkCard;
