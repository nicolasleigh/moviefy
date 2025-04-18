import { useEffect, useState } from "react";
import LiveSearch from "./LiveSearch";
import { renderItem } from "../utils/helper";
import { useSearch } from "../hooks";
import { searchActor } from "../api/actor";
import Label from "./Label";
import { useTranslation } from "react-i18next";

function DirectorSelector({
  updateDirector,
  register,
  name,
  value,
  setValue,
  onSelect,
  ...props
}) {
  // const [value, setValue] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [selectedValue, setSelectedValue] = useState([]);

  const { handleSearch, resetSearch } = useSearch();
  const { t } = useTranslation();

  const handleOnChange = ({ target }) => {
    const { value } = target;
    setValue(value);
    handleSearch(searchActor, value, [], setProfiles);
  };

  const handleOnSelect = (profile) => {
    setValue(profile?.name);
    updateDirector(profile);
    onSelect(profile.id);
    setProfiles([]);
    resetSearch();
  };

  // const [pendingDataPoint, setPendingDataPoint] = useState("");

  // useEffect(() => {
  //   if (pendingDataPoint.includes(",")) {
  //     const newDataPoints = new Set([
  //       ...value,
  //       ...pendingDataPoint.split(",").map((chunk) => chunk.trim()),
  //     ]);
  //     onChange(Array.from(newDataPoints));
  //     setPendingDataPoint("");
  //   }
  // }, [pendingDataPoint, onChange, value]);

  // const addPendingDataPoint = () => {
  //   if (pendingDataPoint) {
  //     const newDataPoints = new Set([...value, pendingDataPoint]);
  //     onChange(Array.from(newDataPoints));
  //     setPendingDataPoint("");
  //   }
  // };

  return (
    <>
      {/* <Label htmlFor='director'>Director</Label> */}
      <LiveSearch
        name="director"
        value={value}
        placeholder={t("Search director...")}
        results={profiles}
        renderItem={renderItem}
        onSelect={handleOnSelect}
        onChange={handleOnChange}
        onUpdate={updateDirector}
        setValue={setValue}
        {...props}
      />
    </>
  );
}

export default DirectorSelector;
