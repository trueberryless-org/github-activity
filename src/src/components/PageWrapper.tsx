import { useState } from "react";

import GitHubUserInput from "../components/GitHubUserInput";
import GitHubActivity from "./GitHubActivity";

export default function CommitListPage(githubToken: any) {
  const [username, setUsername] = useState("trueberryless"); // Default user

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <GitHubUserInput onUserSelect={(user) => setUsername(user)} />
      <h3 className="w-full text-2xl font-bold text-white">
        Showing latest GitHub activity for {username}
      </h3>
      <GitHubActivity username={username} GITHUB_TOKEN={githubToken} />
    </div>
  );
}
