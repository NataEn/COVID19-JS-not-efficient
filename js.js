const FLAGS_URL = `https://www.countryflags.io/`;
const COVID_URL = "https://corona-api.com/countries";
const COUNTRIES_URL = "https://restcountries.herokuapp.com/api/v1/";
const PROXY = "https://api.codetabs.com/v1/proxy/?quest=";
// const proxy = `https://cors-anywhere.herokuapp.com/`;

const app_state = {
  region: "World",
  param: "confirmed",
  chart: null,
};

initiateApp();

async function initiateApp() {
  let covid_data = await fetchCovidData();

  let countries_data = await fetchCountriesDataFromProxy();
  let covidInfoMap = arrangeInfo(covid_data, countries_data);

  let data_presentation = prepareForPresentation(
    covidInfoMap,
    "World",
    "confirmed"
  );

  const chartElement = document.querySelector("#covid-chart");
  let chart = createChartWithData(
    chartElement,
    data_presentation.title,
    data_presentation.labels,
    data_presentation.values
  );
  app_state.chart = chart;

  let countries = getCountriesForContinentFromData(countries_data, "World");
  const countriesButtonsElement = document.querySelector("#countries");
  generateAttachButtons(countries, countriesButtonsElement);

  const continentElements = document.querySelectorAll("#continents button");
  bindEventsToContinentsButtons(continentElements);

  const paramsElements = document.querySelectorAll("#covid-params button");
  bindEventsToParamsButtons(paramsElements);
}
//// REFRESHING DATA UPON EVENTS

async function refreshDataUpdateChart() {
  let covid_data = await fetchCovidData();

  let countries_data = await fetchCountriesDataFromProxy();
  let covidInfoMap = arrangeInfo(covid_data, countries_data);

  let data_presentation = prepareForPresentation(
    covidInfoMap,
    app_state.region,
    app_state.param
  );

  updateChart(
    app_state.chart,
    data_presentation.title,
    data_presentation.labels,
    data_presentation.values
  );
}

async function refreshContinentInfo(region) {
  let countries_data = await fetchCountriesData();
  let countries = getCountriesForContinentFromData(countries_data, region);
  const countriesButtonsElement = document.querySelector("#countries");
  generateAttachButtons(countries, countriesButtonsElement);
}

async function refreshCountryInfo(country_name) {
  let covid_data = await fetchCovidData();

  let countries_data = await fetchCountriesDataFromProxy();
  let covidInfoMap = arrangeInfo(covid_data, countries_data);

  if (!covidInfoMap[app_state.region][country_name]) return;

  country = covidInfoMap[app_state.region][country_name];

  countryDataElement = document.querySelector("#country-data");

  countryDataElement.innerHTML = "";

  const html = `
  <h3 class="country-data-heading">${country_name} : </h3>
  <div class="country-data">
        <h3>Confirmed</h3>
        <p>${country.latest_data.confirmed}</p>
      </div>
      <div class="country-data">
      <h3>New Confirmed</h3>
      <p>${country.today.confirmed}</p>
    </div>
    <div class="country-data">
      <h3>Deaths</h3>
      <p>${country.latest_data.deaths}</p>
    </div>
    <div class="country-data">
    <h3>New Deaths</h3>
    <p>${country.today.deaths}</p>
  </div>
  <div class="country-data">
    <h3>Critical</h3>
    <p>${country.latest_data.critical}</p>
  </div>
  <div class="country-data">
    <h3>Recovered</h3>
    <p>${country.latest_data.recovered}</p>
  </div>`;
  countryDataElement.innerHTML = html;
}
//// FETCHING DATA FROM API
async function fetchCovidData() {
  try {
    const response = await fetch(COVID_URL);
    const json = await response.json();
    return json.data;
  } catch (err) {
    throw new Error(err);
  }
}

async function fetchCountriesDataFromProxy() {
  try {
    const json = await fetch(`${PROXY_URL}${COUNTRIES_URL}`).then((res) =>
      res.json()
    );
    console.log(json.data);
    return json;
  } catch (err) {
    throw new Error(err);
  }
}

function arrangeInfo(covid_info, countries_info) {
  const info = {};

  const worldInfoMap = {};
  for (const country of covid_info) {
    worldInfoMap[country.name] = country;
  }

  for (const country of countries_info) {
    const key = country.name.common;
    const covid_country_data = worldInfoMap[key];

    if (!info[country.region]) info[country.region] = {};
    if (covid_country_data) {
      info[country.region][key] = covid_country_data;
    }
  }
  return info;
}
//// CHART DATA AND ELEMENT
function prepareForPresentation(covidInfoMap, region, covid_param) {
  let title = `${covid_param} in ${region}`;
  let labels = [];
  let values = [];
  if (region === "World") {
    for (const continent in covidInfoMap) {
      for (const country_name in covidInfoMap[continent]) {
        let country = covidInfoMap[continent][country_name];
        if (country.latest_data && country.latest_data[covid_param]) {
          labels.push(country.name);
          values.push(country.latest_data[covid_param]);
        } else {
          console.log("missing data", country, covid_param);
        }
      }
    }
  } else {
    let continent = covidInfoMap[region];
    for (const country_name in continent) {
      let country = continent[country_name];
      if (country.latest_data && country.latest_data[covid_param]) {
        labels.push(country.name);
        values.push(country.latest_data[covid_param]);
      } else {
        console.log("missing data", country, covid_param);
      }
    }
  }

  return {
    title,
    labels,
    values,
  };
}

function createChartWithData(chart_element, title, labels, values) {
  const chartProps = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: title,
          data: values,
          backgroundColor: "rgba(153, 102, 255, 0.2)",

          borderColor: "rgba(255, 159, 64, 1)",

          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  };

  const chart = new Chart(chart_element.getContext("2d"), chartProps);
  return chart;
}

function updateChart(chart_instance, title, labels, values) {
  const chart = chart_instance;
  chart.chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[0].label = title;
  chart.update();
}
//// CREATING DYNAMIC BUTTONS
function getCountriesForContinentFromData(countries_data, region) {
  const countries = [];

  countries_data.forEach((country) => {
    if (region === "World" || country.region === region) {
      countries.push(country.name.common);
    }
  });

  return countries;
}

function generateAttachButtons(countries, target) {
  // target.innerHTML = "";

  countries.forEach((country_name) => {
    function onClickCountry(event) {
      handlerCountryButton(country_name, event);
    }

    const countryButton = document.createElement("span");
    countryButton.classList.add("country-button");
    countryButton.addEventListener("click", onClickCountry);
    countryButton.innerText = country_name;

    target.appendChild(countryButton);
  });
}

//// BINDING EVENTS

function bindEventsToContinentsButtons(elements) {
  elements.forEach((element) => {
    element.addEventListener("click", handlerContinentButton);
  });
}
function bindEventsToParamsButtons(elements) {
  elements.forEach((element) => {
    element.addEventListener("click", handlerParamsButton);
  });
}

/////   HANDLERS

function handlerCountryButton(country_name, event) {
  refreshCountryInfo(country_name);
}

function handlerContinentButton(event) {
  const region = event.target.dataset.continent;
  app_state.region = region;

  refreshDataUpdateChart();
  refreshContinentInfo(region);
}
function handlerParamsButton(event) {
  const param = event.target.dataset.param;
  app_state.param = param;

  refreshDataUpdateChart();
}
