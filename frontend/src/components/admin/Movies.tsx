import { useEffect, useState } from "react";
import MovieListItem from "../MovieListItem";
import { deleteMovie, getMovieForUpdate, getMovies } from "../../api/movie";
import { useMovies, useNotification } from "../../hooks";
import NextAndPrevButton from "../NextAndPrevButton";
import UpdateMovie from "../modals/UpdateMovie";
import ConfirmModal from "../modals/ConfirmModal";
import { DataTable } from "../ui/DataTable";
import { columns } from "./MovieListColumn";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const limit = 6;
let currentPageNo = 0;
let totalPage;

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [noNext, setNoNext] = useState(false);
  const [noPrev, setNoPrev] = useState(false);
  const { t } = useTranslation();

  const fetchMovies = async (pageNo) => {
    const { error, movies, totalMovieCount } = await getMovies(pageNo, limit);
    if (error) return toast.error(t(error));
    if (currentPageNo === 0) {
      setNoPrev(true);
    }

    totalPage = Math.ceil(totalMovieCount / limit);
    if (currentPageNo === totalPage - 1) setNoNext(true);

    if (!movies.length) {
      currentPageNo = pageNo - 1;
      return setNoNext(true);
    }

    setMovies([...movies]);
  };

  const fetchNextPage = () => {
    if (noNext) return;
    if (noPrev) setNoPrev(false);
    currentPageNo += 1;
    fetchMovies(currentPageNo);
  };

  const fetchPrevPage = () => {
    if (currentPageNo <= 0) {
      setNoPrev(true);
      return;
    }
    if (noNext) setNoNext(false);

    currentPageNo -= 1;

    fetchMovies(currentPageNo);
  };

  useEffect(() => {
    fetchMovies(currentPageNo);
  }, []);

  // const hideUpdateForm = () => setShowUpdateModal(false);
  // const hideConfirmModal = () => setShowConfirmModal(false);

  // const handleUIUpdate = () => fetchMovies();
  // console.log(newMovies);

  return (
    <div className="mx-2 mt-3 sm:mx-5 sm:mt-5">
      <DataTable columns={columns} data={movies} />
      <NextAndPrevButton
        className="mt-5"
        onNextClick={fetchNextPage}
        onPrevClick={fetchPrevPage}
        noNext={noNext}
        noPrev={noPrev}
      />
    </div>
  );
}
