import { produce } from "immer";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

export function useList<T>(initialState: T[]): [
  T[],
  {
    set: Dispatch<SetStateAction<T[]>>;
    updateAt: (index: number, value: T) => void;
    removeAt: (index: number) => void;
    push: (value: T) => void;
    move: (index1: number, index2: number) => void;
  }
] {
  const [state, setState] = useState<T[]>(initialState);

  const updateAt = useCallback((index: number, value: T) => {
    setState((state) => [
      ...state.slice(0, index),
      value,
      ...state.slice(index + 1, state.length),
    ]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setState((state) => [
      ...state.slice(0, index),
      ...state.slice(index + 1, state.length),
    ]);
  }, []);

  const push = useCallback((value: T) => {
    setState((state) => [...state, value]);
  }, []);

  const move = useCallback((index1: number, index2: number) => {
    setState(
      produce((draft) => {
        const element = draft[index1];
        draft.splice(index1, 1);
        draft.splice(index2, 0, element);
      })
    );
  }, []);

  return [
    state,
    {
      set: setState,
      updateAt,
      removeAt,
      push,
      move,
    },
  ];
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      setState(JSON.parse(storedValue));
    } else {
      localStorage.setItem(key, JSON.stringify(initialValue));
    }
  }, []);

  const setStateAndSave = useCallback(
    (value: SetStateAction<T>) => {
      const newState: T =
        typeof value === "function" ? (value as Function)(state) : value;

      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
    },
    [key, state]
  );

  return [state, setStateAndSave];
}
