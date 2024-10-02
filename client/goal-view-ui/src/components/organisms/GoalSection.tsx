import { FunctionComponent, useEffect, useRef } from "react";

import { CollapsibleGoal } from "../../types";
import EmptyState from "../atoms/EmptyState";
import GoalCollapsibleSection from "./GoalCollapsibles";
import GoalTabSection from "./GoalTabs";

import classes from "./GoalSection.module.css";

type GoalSectionProps = {
  goals: CollapsibleGoal[];
  collapseGoalHandler: (id: string) => void;
  displaySetting: string;
  emptyMessage: string;
  emptyIcon?: JSX.Element;
  unfocusedGoals?: CollapsibleGoal[];
  helpMessageHandler: (message: string) => void;
};

const goalSection: FunctionComponent<GoalSectionProps> = (props) => {
  const {
    goals,
    collapseGoalHandler,
    displaySetting,
    unfocusedGoals,
    emptyMessage,
    emptyIcon,
    helpMessageHandler,
  } = props;
  const emptyMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (emptyMessageRef.current) {
      emptyMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [goals]);

  //This case should not happen
  if (goals === null) {
    return null;
  }

  const section =
    goals.length === 0 ? (
      unfocusedGoals !== undefined && unfocusedGoals.length > 0 ? (
        <div className={classes.UnfocusedView}>
          <EmptyState message={emptyMessage} icon={emptyIcon} />
          <div className={classes.HintText}>
            Next unfocused goals (focus with bullet):
          </div>
          <div ref={emptyMessageRef} />
          <GoalCollapsibleSection
            goals={unfocusedGoals}
            collapseGoalHandler={collapseGoalHandler}
            helpMessageHandler={helpMessageHandler}
          />
        </div>
      ) : (
        <>
          <EmptyState message={emptyMessage} icon={emptyIcon} />
          <div ref={emptyMessageRef} />
        </>
      )
    ) : displaySetting === "Tabs" ? (
      <GoalTabSection goals={goals} helpMessageHandler={helpMessageHandler} />
    ) : (
      <GoalCollapsibleSection
        goals={goals}
        collapseGoalHandler={collapseGoalHandler}
        helpMessageHandler={helpMessageHandler}
      />
    );

  return section;
};

export default goalSection;
