"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { GENRES } from "@/utils/genres";
import { useCallback, useRef, useState, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

type Genres = Record<"value" | "label" | "className", string>;

export function MultiSelect({ selected, setSelected, onSelect }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // const [selected, setSelected] = useState<Genres[]>([GENRES[0]]);
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();

  const handleUnselect = useCallback(
    (genres: Genres) => {
      // setSelected((prev) => prev.filter((s) => s.value !== genres.value));
      setSelected((prev) => {
        const newSelected = prev.filter((s) => s.value !== genres.value);
        onSelect(newSelected);
        // console.log("inside-newSelected", newSelected);
        return newSelected;
      });
      // onSelect([...selected]);
      // console.log("inside", selected);
    },
    [setSelected, onSelect]
  );
  // console.log("outside", selected);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          setSelected((prev) => {
            const newSelected = [...prev];
            newSelected.pop();
            return newSelected;
          });
        }
      }
      // This is not a default behaviour of the <input /> field
      if (e.key === "Escape") {
        input.blur();
      }
    }
  }, []);

  const selectables = GENRES.filter((genre) => !selected.includes(genre));

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((genre) => {
            return (
              <Badge
                key={genre.value}
                variant="secondary"
                className={genre.className}
              >
                {t(`genres.${genre.label}`)}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(genre);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(genre)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          {/* Avoid having the "Search" Icon */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={t("Select genres...")}
            className=" flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full h-96 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((genre) => {
                  return (
                    <CommandItem
                      key={genre.value}
                      value={genre.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={(value) => {
                        setInputValue("");
                        setSelected((prev) => [...prev, genre]);
                        onSelect([...selected, genre]);
                      }}
                      className={"cursor-pointer " + genre.className}
                    >
                      {t(`genres.${genre.label}`)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
