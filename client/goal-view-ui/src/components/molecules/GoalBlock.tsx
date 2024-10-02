import { FunctionComponent } from "react";

import GoalComponent from "../atoms/Goal";
import Separator from "../atoms/Separator";
import HypothesesBlock from "./HypothesesBlock";

import { Goal } from "../../types";
import classes from "./GoalBlock.module.css";

type GoalBlockProps = {
  goal: Goal;
  goalIndicator?: string;
  helpMessageHandler: (message: string) => void;
};

const goalBlock: FunctionComponent<GoalBlockProps> = (props) => {
  const { goal, goalIndicator, helpMessageHandler } = props;
  const indicator = goalIndicator ? (
    <span className={classes.GoalIndex}>({goalIndicator})</span>
  ) : null;

  return (
    <div className={classes.Block}>
      <HypothesesBlock hypotheses={goal.hypotheses} />
      <div className={classes.SeparatorZone}>
        {" "}
        {indicator} <Separator />{" "}
      </div>
      <GoalComponent goal={goal.goal} setHelpMessage={helpMessageHandler} />
    </div>
  );
};

export default goalBlock;
