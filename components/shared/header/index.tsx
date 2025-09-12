"use client";

import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper";
import HeaderGithub from "@/components/shared/header/Github/GithubClient";
import HeaderNav from "@/components/shared/header/Nav/Nav";
import HeaderToggle from "@/components/shared/header/Toggle/Toggle";
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper";

export default function Header() {
  return (
    <>
      <header className="header z-[3000] relative">
        <HeaderWrapper>
          <div className="flex items-center gap-56">
            <HeaderNav />
          </div>

          <div className="flex items-center gap-16">
            <HeaderGithub />
            <HeaderToggle dropdownContent={undefined} />
          </div>
        </HeaderWrapper>
      </header>

      <HeaderDropdownWrapper />
    </>
  );
}
