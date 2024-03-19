import { useContext } from "react";
import { LoginContext } from "./Login";
import { HotTable } from "@handsontable/react";
import StructurePanel from "./structurepanel/StructurePanel";

export default function MainPage() {
  const { logout } = useContext(LoginContext);

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full h-8 bg-gray-300 flex">
        <select name="types" className="bg-gray-300">
          <option value="new-table">New Table</option>
        </select>
        {/* Separator */} <div className="flex-1" />
        <button className="bg-red-400 pl-2 pr-2" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="flex w-full h-full">
        <div className="flex-1">
          <HotTable
            colHeaders={true}
            manualColumnMove={true}
            dropdownMenu={true}
            licenseKey="non-commercial-and-evaluation"
          />
        </div>
        <div className="flex-shrink-0 w-[30%] h-full bg-gray-200 pr-2 pl-2">
          <StructurePanel />
        </div>
      </div>
    </div>
  );
}
