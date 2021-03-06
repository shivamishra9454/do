import identity from 'lodash/identity';
import api from '../services/api';
import types from '../constants/actionTypes';
import { takeEvery } from 'redux-saga';
import { select, take, takem, call, put } from 'redux-saga/effects'
import { BOARDS_PER_PAGE } from '../constants/config';
import { getAllPage } from '../selectors/boardsSelectors';
import { startProgressBar, stopProgressBar } from '../actions/progressBarActions';
import { hideModal } from '../actions/modalActions';
import {
  fetchBoards,
  fetchStarredBoards,
  fetchBoard,
  createBoard,
  removeBoard,
  updateBoard,
  setPageIndex,
  toggleStarred,
  addBoard,
} from '../actions/boardsActions';

export function* fetchBoardsTask(action) {
  const { pageIndex } = action.payload;
  try {
    const payload = yield call(api.fetchBoards, pageIndex, BOARDS_PER_PAGE);
    yield put(fetchBoards.success({
      ...payload,
      request: {
        pageIndex,
      },
    }));
  } catch(err) {
    yield put(fetchBoards.failure(err.message));
  }
}

export function* fetchStarredBoardsTask(action) {
  try {
    const payload = yield call(api.fetchStarredBoards);
    yield put(fetchStarredBoards.success(payload));
  } catch(err) {
    yield put(fetchStarredBoards.failure(err.message));
  }
}

export function* fetchBoardsOnScroll() {
  const state = yield select(identity);

  const { pathname } = state.routing.locationBeforeTransitions;
  const { ids, isFetching, pageIndex, isLastPage } = state.pages.main.all;

  const isCached = pageIndex * BOARDS_PER_PAGE < ids.length;

  if (pathname !== '/') {
    return;
  }

  if (isCached) {
    yield put(setPageIndex(pageIndex + 1));
    return;
  }

  if (!isFetching && !isLastPage) {
    yield put(fetchBoards.request({ pageIndex: pageIndex + 1 }));
  }
}

export function* fetchBoardTask(action) {
  try {
    yield put(startProgressBar());
    const payload = yield call(api.fetchBoard, action.payload.id);
    yield put(fetchBoard.success(payload));
  } catch(err) {
    yield put(fetchBoard.failure(err.message));
  } finally {
    yield put(stopProgressBar());
  }
}

export function* createBoardTask(action) {
  const { title, description } = action.payload;
  try {
    const payload = yield call(api.createBoard, title, description);
    yield put(createBoard.success(payload));
    yield put(hideModal());
    action.payload.resolve();
  } catch(err) {
    yield put(createBoard.failure(err.message));
    action.payload.reject();
  }
}

export function* removeBoardTask(action) {
  try {
    const { isLastPage, ids } = yield select(getAllPage);

    const payload = yield call(api.removeBoard, action.payload.id);

    if (!isLastPage) {
      // Figure out why ids.length is 15 not 16.
      const payload = yield call(api.fetchBoards, ids.length, 1);
      const boardId = payload.result.boards[0];

      yield put(addBoard(payload.entities.boards[boardId]));
    }

    yield put(removeBoard.success(payload));
    yield put(hideModal());
  } catch(err) {
    yield put(removeBoard.failure(err.message)); 
  }
}

export function* updateBoardTask(action) {
  const { id, props, params } = action.payload;
  try {
    const payload = yield call(api.updateBoard, id, props, params);
    yield put(updateBoard.success(payload));
  } catch(err) {
    yield put(updateBoard.failure(err.message));
  }
}

export function* updateBoardModalFormTask(action) {
  const { id, props, resolve, reject } = action.payload;
  try {
    const payload = yield call(api.updateBoard, id, props);
    yield put(updateBoard.success(payload));
    yield put(hideModal());
    resolve();
  } catch(err) {
    yield put(updateBoard.failure(err.message));
    reject();
  }
}

export function* toggleStarredTask(action) {
  const { id, starred } = action.payload;
  try {
    const payload = yield call(api.updateBoard, id, { starred }, {
      notify: false,
      activity: false,
    });
    yield put(toggleStarred.success(payload));
  } catch(err) {
    yield put(toggleStarred.failure(err.message));
  }
}

export function* watchFetchBoards() {
  yield* takeEvery(types.BOARDS_FETCH_REQUEST, fetchBoardsTask);
}

export function* watchFetchStarredBoards() {
  yield* takeEvery(types.BOARDS_FETCH_STARRED_REQUEST, fetchStarredBoardsTask);
}

export function* watchFetchBoard() {
  yield* takeEvery(types.BOARD_FETCH_REQUEST, fetchBoardTask);
}

export function* watchCreateBoard() {
  yield* takeEvery(types.BOARD_CREATE_REQUEST, createBoardTask);
}

export function* watchRemoveBoard() {
  yield* takeEvery(types.BOARD_REMOVE_REQUEST, removeBoardTask);
}

export function* watchUpdateBoard() {
  yield* takeEvery(types.BOARD_UPDATE_REQUEST, updateBoardTask);
}

export function* watchUpdateBoardModalForm() {
  yield* takeEvery(types.BOARD_UPDATE_MODAL_FORM, updateBoardModalFormTask);
}

export function* watchScrollBottom() {
  yield* takeEvery(types.SCROLL_BOTTOM, fetchBoardsOnScroll);
}

export function* watchToggleStarred() {
  yield* takeEvery(types.BOARD_TOGGLE_STARRED_REQUEST, toggleStarredTask);
}

export function* watchFetchAllAndStarred() {
  while (true) {
    yield take(types.BOARDS_FETCH_REQUEST);
    yield take(types.BOARDS_FETCH_STARRED_REQUEST);

    yield put(startProgressBar());

    for (let i = 0; i < 2; i++) {
      yield take([
        types.BOARDS_FETCH_SUCCESS,
        types.BOARDS_FETCH_FAILURE,
        types.BOARDS_FETCH_STARRED_SUCCESS,
        types.BOARDS_FETCH_STARRED_FAILURE,
      ]);
    }

    yield put(stopProgressBar());
  }
}

export default function* boardsSaga() {
  yield [
    watchFetchBoards(),
    watchFetchStarredBoards(),
    watchFetchBoard(),
    watchCreateBoard(),
    watchRemoveBoard(),
    watchUpdateBoard(),
    watchUpdateBoardModalForm(),
    watchScrollBottom(),
    watchToggleStarred(),
    watchFetchAllAndStarred(),
  ];
}
