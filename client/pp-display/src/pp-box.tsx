import { FunctionComponent, useEffect, useState } from "react";
import PpBreak from "./pp-break";
import PpElided from "./pp-elided";
import classes from "./Pp.module.css";
import { Box, BreakInfo, DisplayType, HideStates } from "./types";

/**
 * Computes the optimal hide state given a hide state for the current box and the hide state for the parent box .
 */
const ComputeHideState = (self: HideStates, parent: HideStates) => {
  // If "parent" state dictates "self", then follow it
  if (parent === HideStates.HIDE || parent === HideStates.EXPAND_ALL) {
    return parent;
  }
  // Otherwise, follow the self state
  return self;
};

interface PpBoxProps extends Box {
  breaks: BreakInfo[];
}

const PpBox: FunctionComponent<PpBoxProps> = (props) => {
  const { mode, id, breaks, boxChildren } = props;

  const [hovered, setHovered] = useState<boolean>(false);
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey) {
      setHovered(true);
    }
  };

  const onKeyUp = (_: KeyboardEvent) => {
    setHovered(false);
  };

  const inner = boxChildren.map((child, i) => {
    if (child) {
      if (child.type === DisplayType.box) {
        return (
          <PpBox
            key={child.id}
            type={child.type}
            id={child.id}
            classList={child.classList}
            mode={child.mode}
            indent={child.indent}
            breaks={breaks}
            boxChildren={child.boxChildren}
          />
        );
      } else if (child.type === DisplayType.break) {
        const lineBreak = breaks.find((br) => br.id === child.id);
        return (
          <PpBreak
            key={child.id}
            id={child.id}
            offset={lineBreak ? lineBreak.offset : 0}
            mode={mode}
            horizontalIndent={child.horizontalIndent}
            lineBreak={lineBreak !== undefined}
          />
        );
      } else if (child.type === DisplayType.elided) {
        return <PpElided id={child.id} />;
      } else {
        return (
          <span key={"term" + i} className={child.classList.join(" ")}>
            {child.content}
          </span>
        );
      }
    } else {
      // If the child is undefined, return an empty fragment
      return <></>;
    }
  });

  const classNames = hovered ? [classes.Box, classes.Hovered] : [classes.Box];

  return (
    <span
      id={id}
      className={classNames.join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        // In here we probably need to call out to a pass in function to make the box with "id" visible
      }}
    >
      {inner}
    </span>
  );
};

export default PpBox;
