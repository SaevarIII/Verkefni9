import { getLaunch, searchLaunches } from "./api.js";
import { el } from "./elements.js";

/**
 * Býr til leitarform.
 * @param {(e: SubmitEvent) => void} searchHandler Fall sem keyrt er þegar leitað er.
 * @param {string | undefined} query Leitarstrengur.
 * @returns {HTMLElement} Leitarform.
 */
export function renderSearchForm(searchHandler, query = undefined) {
  const form = el(
    "form",
    {},
    el("input", { value: query ?? "", name: "query" }),
    el("button", {}, "Leita"),
  );

  form.addEventListener("submit", searchHandler);

  return form;
}

/**
 * Setur „loading state“ skilabað meðan gögn eru sótt.
 * @param {HTMLElement} parentElement Element sem á að birta skilbaoð í.
 * @param {Element | undefined} searchForm Leitarform sem á að gera óvirkt.
 */
function setLoading(parentElement, searchForm = undefined) {
  let loadingElement = parentElement.querySelector(".loading");

  if (!loadingElement) {
    loadingElement = el("div", { class: "loading" }, "Sæki gögn...");
    parentElement.appendChild(loadingElement);
  }

  if (!searchForm) {
    return;
  }

  const button = searchForm.querySelector("button");

  if (button) {
    button.setAttribute("disabled", disabled);
  }
}

/**
 * Fjarlægir „loading state“.
 * @param {HTMLElement} parentElement Element sem inniheldur skilaboð.
 * @param {Element | undefined} searchForm Leitarform sem á að gera virkt.
 */
function setNotLoading(parentElement, searchForm = undefined) {
  const loadingElement = parentElement.querySelector(".loading");

  if (loadingElement) {
    loadingElement.remove();
  }

  if (!searchForm) {
    return;
  }

  const disabledButton = searchForm.querySelector("button[disabled]");

  if (disabledButton) {
    disabledButton.removeAttribute("disabled");
  }
}

/**
 * Birta niðurstöður úr leit.
 * @param {import('./api.types.js').Launch[] | null} results Niðurstöður úr leit
 * @param {string} query Leitarstrengur.
 */
function createSearchResults(results, query) {
  const list = el("ul", { class: "results" });

  if (!results) {
    const noResultsElement = el("li", {}, `Villa við leit að ${query}`);
    list.appendChild(noResultsElement);
    return list;
  }

  if (results.length === 0) {
    const noResultsElement = el(
      "li",
      {},
      `Engar niðurstöður fyrir leit að ${query}`,
    );
    list.appendChild(noResultsElement);
    return list;
  }

  for (const result of results) {
    const resultElement = el(
      "li",
      { class: "result" },
      el("span", { class: "name" }, result.name),
      el("span", { class: "mission" }, result.mission),
    );

    list.appendChild(resultElement);
  }

  return list;
}

/**
 *
 * @param {HTMLElement} parentElement Element sem á að birta niðurstöður í.
 * @param {Element} searchForm Form sem á að gera óvirkt.
 * @param {string} query Leitarstrengur.
 */
export async function searchAndRender(parentElement, searchForm, query) {
  const mainElement = parentElement.querySelector("main");

  if (!mainElement) {
    console.warn("fann ekki <main> element");
    return;
  }

  // Fjarlægja fyrri niðurstöður
  const resultsElement = mainElement.querySelector(".results");
  if (resultsElement) {
    resultsElement.remove();
  }

  setLoading(mainElement, searchForm);
  const results = await searchLaunches(query);
  setNotLoading(mainElement, searchForm);

  const resultsEl = createSearchResults(results, query);

  mainElement.appendChild(resultsEl);
}

/**
 * Sýna forsíðu, hugsanlega með leitarniðurstöðum.
 * @param {HTMLElement} parentElement Element sem á að innihalda forsíðu.
 * @param {(e: SubmitEvent) => void} searchHandler Fall sem keyrt er þegar leitað er.
 * @param {string | undefined} query Leitarorð, ef eitthvað, til að sýna niðurstöður fyrir.
 */
export function renderFrontpage(
  parentElement,
  searchHandler,
  query = undefined,
) {
  const heading = el(
    "h1",
    { class: "heading", "data-foo": "bar" },
    "Geimskotaleitin 🚀",
  );
  const searchForm = renderSearchForm(searchHandler, query);

  const container = el("main", {}, heading, searchForm);
  parentElement.appendChild(container);

  if (!query) {
    return;
  }

  searchAndRender(parentElement, searchForm, query);
}

/**
 * Sýna geimskot.
 * @param {HTMLElement} parentElement Element sem á að innihalda geimskot.
 * @param {string} id Auðkenni geimskots.
 */
export async function renderDetails(parentElement, id) {
  setLoading(parentElement);

  try {
    const launch = await getLaunch(id);

    if (!launch) {
      const noResultsElement = el(
        "li",
        { class: "no-result" },
        `Ekkert kom upp fyrir geimskotið: ${id}`,
      );
      parentElement.appendChild(noResultsElement);
      return;
    }

    const container = el(
      "main",
      { class: "details" },
      el("h1", { class: "launch-name" }, `${launch.name}`),
      el(
        "div",
        { class: "windows" },
        el("p", { class: "start" }, `gluggi opinn: ${launch.window_start}`),
        el("p", { class: "end" }, `gluggi lokaður: ${launch.window_end}`),
      ),
      el("img", { class: "image", src: `${launch.image}` }),
      el("span", { class: "status-name" }, `${launch.status}`),
      el("span", { class: "status-description" }, `${launch.status}`),
      el("span", { class: "mission-name" }, `${launch.mission}`),
      el("span", { class: "mission-description" }, `${launch.mission}`),
    );

    const backElement = el(
      "div",
      { class: "back" },
      el("a", { href: "/" }, "Til baka"),
    );
    parentElement.appendChild(backElement);
    parentElement.appendChild(container);
  } catch (error) {
    console.error("Error fetching launch details:", error);
  } finally {
    setNotLoading(parentElement);
  }
}
