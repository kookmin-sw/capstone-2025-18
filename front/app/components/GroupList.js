"use client";

import GroupItem from "./GroupItem";

export default function GroupList({
  groups,
  openGroup,
  toggleGroup,
  moveToIndividualPage,
  openExitPopup,
}) {
  return (
    <div className="max-h-[calc(100vh-120px)] overflow-y-auto touch-pan-y custom-scrollbar">
      {groups.map((group) => (
        <GroupItem
          key={group.groupId}
          group={group}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          moveToIndividualPage={moveToIndividualPage}
          openExitPopup={openExitPopup}
        />
      ))}
    </div>
  );
}
