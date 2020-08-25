window.onload = () => {
  getCountriesData();
  getHistoricalData();
  getWorldCoronaData();
};

var map;
var infoWindow;
let coronaGlobaldata;
let mapCircles = [];
const worldwideselection = {
  name: "Worldwide",
  value: "www",
  selected: true,
};
var casesTypeColors = {
  cases: "#cc1034",
  recovered: "#7fd922",
  deaths: "#c285ff",
};

const mapCenter = {
  lat: 34.80746,
  lng: -40.4796,
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: mapCenter,
    zoom: 2.5,
    styles: mapStyle,
  });
  infoWindow = new google.maps.InfoWindow();
}

const changeDataSelection = (elem, casesType) => {
  clearTheMap();
  showDataOnMap(coronaGlobaldata, casesType);
  setActiveTab(elem);
};

const setActiveTab = (elem) => {
  const activeEl = document.querySelector(".card.active");
  activeEl.classList.remove("active");
  elem.classList.add("active");
};

const clearTheMap = () => {
  for (let circle of mapCircles) {
    circle.setMap(null);
  }
};

const setMapCenter = (lat, long, zoom) => {
  map.setZoom(zoom);
  map.panTo({
    lat: lat,
    lng: long,
  });
};

const initDropdown = (searchList) => {
  $(".ui.dropdown").dropdown({
    values: searchList,
    onChange: function (value, text) {
      if (value !== worldwideselection.value) {
        getCountryData(value);
      } else {
        getWorldCoronaData();
      }
    },
  });
};

const setSearchList = (data) => {
  let searchList = [];
  searchList.push(worldwideselection);
  data.forEach((countryData) => {
    searchList.push({
      name: countryData.country,
      value: countryData.countryInfo.iso3,
    });
  });
  initDropdown(searchList);
};

const getCountriesData = () => {
  fetch("https://corona.lmao.ninja/v2/countries")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      coronaGlobaldata = data;
      setSearchList(data);
      setStatsData(data);
      showDataOnMap(data);
      showDataInTable(data);
    });
};

const getCountryData = (countryIso) => {
  const url = "https://disease.sh/v3/covid-19/countries/" + countryIso;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      setStatsData(data);
      setMapCenter(data.countryInfo.lat, data.countryInfo.long, 5);
    });
};

const getWorldCoronaData = () => {
  fetch("https://corona.lmao.ninja/v3/covid-19/all")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      setStatsData(data);
      setMapCenter(mapCenter.lat, mapCenter.lng, 2.5);
      // buildPieChart(data);
    });
};

const setStatsData = (data) => {
  let addedCases = numeral(data.todayCases).format("+0,0");
  let addedRecovered = numeral(data.todayRecovered).format("+0,0");
  let addedDeaths = numeral(data.todayDeaths).format("+0,0");
  let totalCases = numeral(data.cases).format("0.0a");
  let totalRecovered = numeral(data.recovered).format("0.0a");
  let totalDeaths = numeral(data.deaths).format("0.0a");
  document.querySelector(".total-number").innerHTML = addedCases;
  document.querySelector(".recovered-number").innerHTML = addedRecovered;
  document.querySelector(".deaths-number").innerHTML = addedDeaths;
  document.querySelector(".cases-total").innerHTML = `${totalCases} Total`;
  document.querySelector(
    ".recovered-total"
  ).innerHTML = `${totalRecovered} Total`;
  document.querySelector(".deaths-total").innerHTML = `${totalDeaths} Total`;
};

const getHistoricalData = () => {
  fetch("https://corona.lmao.ninja/v2/historical/all?lastdays=120")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      let chartData = buildChartData(data);
      buildChart(chartData);
    });
};

const buildChartData = (data) => {
  let chartData = [];
  let lastDataPoint;
  for (let date in data.cases) {
    if (lastDataPoint) {
      let newDataPoint = {
        x: date,
        y: data.cases[date] - lastDataPoint,
      };
      chartData.push(newDataPoint);
    }
    lastDataPoint = data.cases[date];
  }
  return chartData;
};

const buildPieChart = (data) => {
  var ctx = document.getElementById("myPieChart").getContext("2d");
  var myPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      datasets: [
        {
          data: [data.active, data.recovered, data.deaths],
          backgroundColor: ["#9d80fe", "#7dd71d", "#fb4443"],
        },
      ],

      // These labels appear in the legend and in the tooltips when hovering different arcs
      labels: ["Active", "Recovered", "Deaths"],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

const buildChart = (chartData) => {
  var timeFormat = "MM/DD/YY";
  var ctx = document.getElementById("myChart").getContext("2d");
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      datasets: [
        {
          label: "Total Cases",
          backgroundColor: "#F7A1B1",
          borderColor: "#cc1034",
          data: chartData,
        },
      ],
    },

    // Configuration options go here
    options: {
      maintainAspectRatio: false,
      tooltips: {
        mode: "index",
        intersect: false,
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      scales: {
        xAxes: [
          {
            type: "time",
            time: {
              format: timeFormat,
              tooltipFormat: "ll",
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                return numeral(value).format("0,0a");
              },
            },
          },
        ],
      },
    },
  });
};

const openInfoWindow = () => {
  infoWindow.open(map);
};

const showDataOnMap = (data, casesType = "cases") => {
  data.map((country) => {
    let countryCenter = {
      lat: country.countryInfo.lat,
      lng: country.countryInfo.long,
    };

    var countryCircle = new google.maps.Circle({
      strokeColor: casesTypeColors[casesType],
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: casesTypeColors[casesType],
      fillOpacity: 0.35,
      map: map,
      center: countryCenter,
      radius: country[casesType] / 2,
    });

    mapCircles.push(countryCircle);

    var html = `
            <div class="info-container">
                <div class="info-flag" style="background-image: url(${
                  country.countryInfo.flag
                });">
                </div>
                <div class="info-name">
                    ${country.country}
                </div>
                <div class="info-confirmed">
                    Total: ${numeral(country.cases).format("0,0")}
                </div>
                <div class="info-recovered">
                    Recovered: ${numeral(country.recovered).format("0,0")}
                </div>
                <div class="info-deaths">   
                    Deaths: ${numeral(country.deaths).format("0,0")}
                </div>
            </div>
        `;

    var infoWindow = new google.maps.InfoWindow({
      content: html,
      position: countryCircle.center,
    });
    google.maps.event.addListener(countryCircle, "mouseover", function () {
      infoWindow.open(map);
    });

    google.maps.event.addListener(countryCircle, "mouseout", function () {
      infoWindow.close();
    });
  });
};

const showDataInTable = (data) => {
  var html = "";
  data.forEach((country) => {
    html += `
        <tr>
            <td>${country.country}</td>
            <td class="table-numberCases">${numeral(country.cases).format(
              "0,0"
            )}</td>
        </tr>
        `;
  });
  document.getElementById("table-data").innerHTML = html;
};
