import { forwardRef, useEffect, useRef, useState } from 'react';
import { commonInputClasses } from '../utils/theme';

function LiveSearch({
  value = '',
  placeholder = '',
  results = [],
  selectedResultStyle,
  resultContainerStyle,
  inputStyle,
  renderItem = null,
  onSelect = null,
  onChange = null,
}) {
  const [displaySearch, setDisplaySearch] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleOnFocus = () => {
    if (results.length) setDisplaySearch(true);
  };

  const closeSearch = () => {
    setDisplaySearch(false);
    setFocusedIndex(-1);
  };

  const handleOnBlur = () => {
    setTimeout(() => {
      closeSearch();
    }, 100);
  };

  const handleSelection = (selectedItem) => {
    onSelect(selectedItem);
  };

  const handleKeyDown = ({ key }) => {
    let nextCount;
    const keys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
    if (!keys.includes(key)) return;

    // move selection up and down
    if (key === 'ArrowDown') {
      nextCount = (focusedIndex + 1) % results.length;
    }
    if (key === 'ArrowUp') {
      nextCount = (focusedIndex + results.length - 1) % results.length;
    }
    if (key === 'Enter') return handleSelection(results[focusedIndex]);

    setFocusedIndex(nextCount);
  };

  const getInputStyle = () => {
    return inputStyle
      ? inputStyle
      : commonInputClasses + ' border-2 rounded p-1 text-lg';
  };

  return (
    <div className='relative'>
      <input
        type='text'
        className={getInputStyle()}
        placeholder={placeholder}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onKeyDown={handleKeyDown}
        value={value}
        onChange={onChange}
      />
      <SearchResults
        focusedIndex={focusedIndex}
        visible={displaySearch}
        results={results}
        onSelect={handleSelection}
        renderItem={renderItem}
        resultContainerStyle={resultContainerStyle}
        selectedResultStyle={selectedResultStyle}
      />
    </div>
  );
}

// const renderItem = ({ id, name, avatar }) => {
//   return (
//     <div>
//       <img src={avatar} alt={name} className='w-16 h-16 rounded object-cover' />
//       <p className='dark:text-white font-semibold'></p>
//     </div>
//   );
// };

const SearchResults = ({
  visible,
  results = [],
  focusedIndex,
  onSelect,
  renderItem,
  resultContainerStyle,
  selectedResultStyle,
}) => {
  const resultContainer = useRef();

  useEffect(() => {
    resultContainer.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedIndex]);

  if (!visible) return null;
  return (
    <div className='absolute right-0 left-0 top-10 bg-white dark:bg-secondary shadow-md p-2 max-h-64 space-y-2 mt-1 overflow-auto custom-scroll-bar'>
      {results.map((result, index) => {
        const getSelectedClass = () => {
          return selectedResultStyle
            ? selectedResultStyle
            : 'dark:bg-dark-subtle bg-light-subtle';
        };
        return (
          <ResultCard
            ref={index === focusedIndex ? resultContainer : null}
            key={result.id}
            item={result}
            renderItem={renderItem}
            resultContainerStyle={resultContainerStyle}
            selectedResultStyle={
              index === focusedIndex ? getSelectedClass() : ''
            }
            onClick={() => onSelect(result)}
          />
        );
      })}
    </div>
  );
};

// eslint-disable-next-line react/display-name
const ResultCard = forwardRef((props, ref) => {
  const {
    item,
    renderItem,
    resultContainerStyle,
    selectedResultStyle,
    onClick,
  } = props;

  const getClasses = () => {
    if (resultContainerStyle)
      return resultContainerStyle + ' ' + selectedResultStyle;

    return (
      selectedResultStyle +
      ' cursor-pointer rounded overflow-hidden dark:hover:bg-dark-subtle hover:bg-light-subtle transition '
    );
  };

  return (
    <div onClick={onClick} ref={ref} className={getClasses()}>
      {renderItem(item)}
    </div>
  );
});

export default LiveSearch;
