import { FunctionComponent } from "react";

import { CollapsibleGoal } from "../../types";
import Accordion from "../atoms/Accordion";
import GoalBlock from "./GoalBlock";

type CollapsibleGoalBlockProps = {
  goal: CollapsibleGoal;
  collapseHandler: (id: string) => void;
  goalIndex: number;
  goalIndicator: string;
  helpMessageHandler: (message: string) => void;
};

const collapsibleGoalBlock: FunctionComponent<CollapsibleGoalBlockProps> = (
  props,
) => {
  const {
    goal,
    goalIndex,
    goalIndicator,
    collapseHandler,
    helpMessageHandler,
  } = props;

  return (
    <Accordion
      title={"Goal " + goalIndex}
      collapsed={!goal.isOpen}
      collapseHandler={() => collapseHandler(goal.id)}
    >
      <GoalBlock
        goal={goal}
        goalIndicator={goalIndicator}
        helpMessageHandler={helpMessageHandler}
      />
    </Accordion>
  );
};

export default collapsibleGoalBlock;
