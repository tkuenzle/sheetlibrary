import "./arriving.css";

import {
  type AnimationEvent,
  createContext,
  type ReactNode,
  use,
  useEffect,
  useState,
} from "react";

// Data that takes the place of bars fades in, once: the parts that arrive
// with it fade, and what shows later, such as new search results, shows at
// once. See docs/motion.md ("Rows fade in where the bars were") and
// openspec/specs/site-layout ("Data fades in where the bars were").
//
//   <Arriving> sees `arrived` --> arriving: true  --> parts mount, read it once
//   its next effect           --> arriving: false --> later parts show at once
//   a part's fade ends        --> it drops the class, so it never plays again
const ArrivingContext = createContext(false);

// Marks what it holds as arriving in the commit where `arrived` is first
// true, and only then. Render it around data that replaces bars: a page's
// data mounts once it is there, so it arrives as it mounts. A dialog's list
// passes whether it replaced bars that were seen.
export function Arriving({
  arrived = true,
  children,
}: {
  arrived?: boolean;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (arrived) setOver(true);
  }, [arrived]);
  return <ArrivingContext value={arrived && !over}>{children}</ArrivingContext>;
}

// The props for a part that stood for bars: `className` with the fade's
// class if the part mounted as its data arrived, and the handler that drops
// the class once the fade has ended, so that putting the element back, as
// when a row comes back after a failed delete, doesn't play it again.
// `stoodForBars` is false for a part the skeleton showed for real, such as
// a collection's name the rail knew.
export function useArrives(
  className = "",
  stoodForBars = true,
): {
  className: string | undefined;
  onAnimationEnd: (event: AnimationEvent) => void;
} {
  const arriving = use(ArrivingContext);
  const [arrives, setArrives] = useState(arriving && stoodForBars);
  return {
    className: arrivesClass(className, arrives),
    onAnimationEnd: (event) => {
      if (
        event.target === event.currentTarget &&
        event.animationName === ARRIVE
      ) {
        setArrives(false);
      }
    },
  };
}

type ArrivesProps = ReturnType<typeof useArrives>;

// useArrives() for an element that a page shows only at times, such as the
// sheet's chips: rendered in `children`, it reads "arriving" when the
// element mounts, not when the page does.
export function Arrives({
  className,
  stoodForBars,
  children,
}: {
  className?: string;
  stoodForBars?: boolean;
  children: (props: ArrivesProps) => ReactNode;
}) {
  return children(useArrives(className, stoodForBars));
}

// The fade's keyframes, in arriving.css.
const ARRIVE = "arrive";

export function arrivesClass(
  className: string,
  arrives: boolean,
): string | undefined {
  const names = arrives ? `${className} arrives`.trim() : className;
  return names === "" ? undefined : names;
}
