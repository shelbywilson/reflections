import { useOptics } from "../contexts/OpticsContext";
import type { DisplayState } from "../util/types";

interface ToolbarProps {
  displayState: DisplayState;
  setDisplayState: (key: keyof DisplayState, newVal: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ displayState, setDisplayState }) => {
  const { mirrors, removeMirror, addMirror } = useOptics();

  return (
    <div className="absolute w-full border-b-1 border-b-black bg-white p-4 flex">
      <div className="flex flex-row justify-between w-full gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <label htmlFor="mirrors" className="mr-2 text-sm font-medium">
              Mirrors
            </label>
            <input
              id="mirrors"
              type="range"
              min="0"
              max="3"
              value={mirrors.length}
              onChange={(e) => {
                if (parseInt(e.target.value) < mirrors.length) {
                  removeMirror(mirrors.length - 1);
                } else {
                  addMirror();
                }
              }}
              className="w-24"
            />
            <span className="ml-2">{mirrors.length}</span>
          </div>
          {mirrors.length > 1 ? (
            <div className="flex items-center">
              <label htmlFor="lightRays" className="mr-2 text-sm font-medium">
                Show virtual mirrors
              </label>
              <input
                id="lightRays"
                type="checkbox"
                checked={displayState.showVirtualMirrors}
                onChange={(e) =>
                  setDisplayState("showVirtualMirrors", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="flex items-center gap-6 text-xs">
          <em>
            click to drag mirror, observer, and object
          </em>
          <a className="underline hover:no-underline" href='https://github.com/shelbywilson/reflections/blob/main/README.md' target="_blank">about</a>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
