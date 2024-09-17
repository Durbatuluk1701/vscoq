import { FunctionComponent, useEffect, useState } from "react";
import PpBreak from "./pp-break";
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
  coqCss: CSSModuleClasses;
  breaks: BreakInfo[];
  parentHide: HideStates;
  // hovered: boolean,
  // addedDepth: number,
}

const PpBox: FunctionComponent<PpBoxProps> = (props) => {
  const { mode, coqCss, id, breaks, boxChildren, parentHide } = props;
  // const [selfHide, setSelfHide] = useState<HideStates>(
  //   ComputeHideState(
  //     depth >= maxDepth ? HideStates.HIDE : HideStates.UNHIDE,
  //     parentHide,
  //   ),
  // );
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

  const inner =
    // selfHide === HideStates.HIDE
    //   ? ellpisis
    boxChildren.map((child, i) => {
      if (child) {
        if (child.type === DisplayType.box) {
          return (
            <PpBox
              key={child.id}
              type={child.type}
              parentHide={parentHide}
              coqCss={coqCss}
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
        } else {
          return (
            <span key={"term" + i} className={child.classList.join(" ")}>
              {child.content}
            </span>
          );
        }
      }
    });

  const classNames = hovered ? [classes.Box, classes.Hovered] : [classes.Box];

  return (
    <span
      // id={id}
      className={classNames.join(" ")}
      // onClick={(e) => {
      //   e.stopPropagation();
      //   if (e.altKey) {
      //     if (selfHide === HideStates.HIDE) {
      //       // setDepthOpen(depthOpen + ADDED_DEPTH_FACTOR);
      //       setSelfHide(e.shiftKey ? HideStates.EXPAND_ALL : HideStates.UNHIDE);
      //     } else {
      //       // We must be in a visible state, so turn to hide
      //       // setDepthOpen(Math.max(depthOpen - ADDED_DEPTH_FACTOR, 0));
      //       setSelfHide(HideStates.HIDE);
      //     }
      //   }
      // }}
    >
      {inner}
    </span>
  );
};

export default PpBox;
