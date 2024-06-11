let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;

let stationStatusLayers = {
  "Out of Order":  new L.layerGroup(),
  "Coming Soon": new L.layerGroup(),
  "Empty": new L.layerGroup(),
  "Low": new L.layerGroup(),
  "Healthy": new L.layerGroup()
};

let map = L.map("map-id").setView(newYorkCoords, mapZoomLevel);

let tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})

tile.addTo(map);

let baselayer ={
  "Street View": tile
}

let overlayMaps = {
  "Out of Order":  stationStatusLayers["Out of Order"],
  "Coming Soon":stationStatusLayers["Coming Soon"],
  "Empty": stationStatusLayers["Empty"],
  "Low": stationStatusLayers["Low"],
  "Healthy": stationStatusLayers["Healthy"]
};

L.control.layers(baselayer, overlayMaps, {
  collapsed: false
}).addTo(map);

// When the layer control is added, insert a div with the class of "legend".

let info = L.control({
  position: "bottomright"
});
info.onAdd = function() {
  let div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map.
info.addTo(map);


let markerTemplates = {
  "Out of Order":   L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: 'green',
    shape: 'circle'}),
  "Coming Soon": L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: 'yellow',
    shape: 'circle'}),
  "Empty":  L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: 'orange',
    shape: 'circle'}),
  "Low":  L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: 'grey',
    shape: 'circle'}),
  "Healthy":  L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: 'green',
    shape: 'circle'})
 
};

function updateLegend(time, stationCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Updated: " + moment.unix(time).format("h:mm:ss A") + "</p>",
    "<p class='out-of-order'>Out of Order Stations: " + stationCount['Out of Order'] + "</p>",
    "<p class='coming-soon'>Stations Coming Soon: " + stationCount['Coming Soon']+ "</p>",
    "<p class='empty'>Empty Stations: " + stationCount['Empty'] + "</p>",
    "<p class='low'>Low Stations: " + stationCount['Low']  + "</p>",
    "<p class='healthy'>Healthy Stations: " + stationCount['Healthy'] + "</p>"
  ].join("");
}

d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then((resData)=>{
  let stationInfoData = resData.data.stations
  
  stationInfoData.sort((a,b) => {
    return a["station_id"]-b["station_id"];
  })
  console.log(stationInfoData);

  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then((resData) =>{
    let updatedTS = resData.last_updated;

    let stationStatusData = resData.data.stations;
    
    stationStatusData.sort((a,b) => {
      return a["station_id"]-b["station_id"];
    })
    console.log(stationStatusData);

    if (stationInfoData.length != stationStatusData.length){
      console.log("Number of stations don't match between API endpoints- Station Info and Station Status");
    }
    else{
      let stationCount = stationInfoData.length;
      let station, statusCode;
      let stationStatusCount = {
        "Out of Order":  0,
        "Coming Soon":0,
        "Empty": 0,
        "Low": 0,
        "Healthy": 0
      }

    

      // * **Low Stations:** This applies if a station has less than five available bikes.

      // * **Healthy Stations:** This applies if a marker doesn't fall into any of the previous layer groups.

      for (let i=0; i<stationCount; i++){
        station = Object.assign({}, stationInfoData[i], stationStatusData[i]);
        
        if (station.is_installed && !station.is_renting){
          statusCode = "Out of Order"
         
        }
        else if (!station.is_installed){
          statusCode = "Coming Soon"
        }  else if (!station.num_bikes_available){
          statusCode = "Empty"
        }
        else if (station.num_bikes_available<5){
          statusCode = "Low"
        }  else{
          statusCode = "Healthy"
        }
      
        let stationMarker = L.marker([station.lat,station.lon], {icon: markerTemplates[statusCode]});

        stationMarker.bindPopup(`<h3>${station.name}</h3> <hr> <h5>Capacity: ${station.capacity} <br/>Bikes Avail: ${station.num_bikes_available}</h5> `)

        stationMarker.addTo(stationStatusLayers[statusCode]);
        stationStatusCount[statusCode]++;
        

      }
      console.log(stationStatusCount);
      updateLegend(updatedTS, stationStatusCount);

    }

  })
  });
