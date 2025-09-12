
import GithubFlame from "./Flame/Flame";

export default function HeaderDropdownGithub() {
  return (
    <div className="py-24 px-44 border-b border-border-faint relative overflow-clip">

      <div className="text-label-large">
        CodinIT.dev is open source. <br />
        Star us to show your support!
      </div>

      <GithubFlame />
    </div>
  );
}
