import React, { Component } from 'react';
import LazyHero from 'react-lazy-hero';
import { message, AutoComplete, Slider, InputNumber, Button, Row, Col, Icon, Steps, Divider} from 'antd';
import 'antd/dist/antd.css';
import ReactMapboxGl, { Layer, Feature, Popup } from "react-mapbox-gl";


/*--------------------CONSTANTS-----------------------------------------------*/
const Step = Steps.Step;
const google = window.google;
const Map = ReactMapboxGl({
  accessToken: "pk.eyJ1IjoiYnJhZDA0MTIiLCJhIjoiY2prdjYyMTIzMG03ZDNxcW5ra29mbmxrMiJ9.YwP-MY1_8to9i1kINJRY4Q"
});

const markerInformation = [
  {color: "#12A4D7", day: "Day 1"},
  {color: "#01A851", day: "Day 2"},
  {color: "#6E2F8F", day: "Day 3"},
  {color: "#B80C09", day: "Day 4"},
  {color: "#FFBA15", day: "Day 5"},
  {color: "#E53D00", day: "Day 6"},
  {color: "#0A2463", day: "Day 7"},
  {color: "#36151E", day: "Day 8"},
  {color: "#92374D", day: "Day 9"},
  {color: "#00A878", day: "Day 10"}
]

const stepIcons = {fontSize: "3vh", marginBottom: "2vh"}

/*------------------------------CLUSTER CLASS-------------------------------------------*/

class Cluster {

  constructor(point){
    this.points = [point];
  }

  addPoint = function(newPoint) {
    this.points.push(newPoint)
  }

  getClusterCenter = function()  {
    if(this.points.length===1){
      return ({lat: this.points[0].lat, lng: this.points[0].lng})
    }

    var bounds = new google.maps.LatLngBounds();
    for(var i = 0; i<this.points.length; i++){
        bounds.extend({lat: this.points[i].lat, lng: this.points[i].lng});
    }
    return ({lat: bounds.getCenter().lat(), lng: bounds.getCenter().lng()});
  }
}

/*---------------HIERARCHICAL CLUSTERING FUNCTIONS--------------------------------------*/

function calculateDistance(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function cluster(data, k){
  var clusters = [];

  for(var y = 0; y<data.length; y++){
    var c = new Cluster(data[y]);
    clusters.push(c)
  }

  while(clusters.length!=k){
    var distances = [];

    var minDistance = Infinity;
    var minI;
    var minJ;

    //Compute all combination distances and find the mininum i and j
    for(var i = 0; i<clusters.length; i++){
      for(var j = 0; j<clusters.length; j++){
        var centerI = clusters[i].getClusterCenter();
        var centerJ = clusters[j].getClusterCenter();

        var d = calculateDistance(centerI.lat, centerI.lng, centerJ.lat, centerJ.lng);

        if(d < minDistance && d!==0){
          minI = i;
          minJ = j;
          minDistance = d;
        }
      }
    }

    //Combine the two clusters points into one and remove the old one
    var c = clusters[minI]
    for(var p = 0; p<clusters[minI].points.length; p++){
      clusters[minJ].points.push(clusters[minI].points[p]);
    }
    clusters = clusters.filter(item => item!=c)
  }
  //Assign final locations clusters to pass to map to generate markers.
  var finalLocations = [];
  for(var a = 0; a<clusters.length; a++){
    for(var b = 0; b<clusters[a].points.length; b++){
      var loc = clusters[a].points[b];
      loc.color = markerInformation[a].color;
      loc.day = markerInformation[a].day;
      finalLocations.push(loc)
    }
  }
  return finalLocations;
}

/*---------------------------------------BASIC VISUALCOMPONENTS----------------------------------------------------*/


function ProgressBar(props){
  return (
    <Steps current={props.current}>
         <Step title="Welcome"/>
         <Step title="Duration"/>
         <Step title="Locations"/>
         <Step title="Itinerary"/>
    </Steps>
  );
}

function HeroChild(props){
  return (
    <div>
      <Icon type="compass" style={{color: "white", fontSize: "8vh"}}/>
      <h1 style={{color: "white", fontSize:"10vh"}}>Clusty</h1>

      <Icon style={{marginTop: "15vh", color: "white", fontSize: "6vh"}} type="arrow-down"/>
    </div>
  );
}

function Hero(props) {
  return (
    <LazyHero parallaxOffset={100} minHeight="100vh" opacity={0} imageSrc="https://pro2-bar-s3-cdn-cf.myportfolio.com/75e6eb9f4cff2617370d89cc4f8401da/819c17a2-ac5f-4794-9f93-54d5f706fab9_rw_1920.jpg?h=86b828abbccf85065b296c22c3cc3f46">
      <HeroChild/>
    </LazyHero>
  );
}

/*---------------------------------------------STATELESS FUNCTIONAL COMPONENTS FOR STEPS-------------------------------------*/

function WelcomePage(props){
  return (
    <Row style={{marginTop: "2vh"}} type="flex" justify="center">
      <Col align="center" span={6}>
        <Icon type="question" style={stepIcons} />
        <h2>The Location Based Itinerary Generator</h2>
        <p>
          Clusty is a travel planner that generates a smart itinerary based on locations you want to visit over a
          certain amount of days. It uses distance based clustering algorithms to calculate an optimal plan of which places to visit when, saving you time wasted travelling. Click next to continue!
        </p>
      </Col>
    </Row>
  );
}

function DayPicker(props){
  return (
    <Row type="flex" justify="center" >
      <Col span={6} align="center">
        <Icon type="hourglass" style={stepIcons}/>
        <p style={{marginBottom: "6vh"}}>How many days are you travelling for?</p>
        <Slider style={{marginBottom: "2vh"}} min={1} max={10} onChange={props.onChange} value={props.value} />
        <InputNumber min={1} max={10} onChange={props.onChange} value={props.value}/>
      </Col>
    </Row>
  );
}

function LocationPicker(props){
  return (
    <div>
      <Row style={{marginBottom: "6vh"}} type="flex" justify="center">
        <Col span={8} align="center">
          <Icon type="environment-o" style={stepIcons}/>
          <p>Where do you want to visit?</p>
        </Col>
      </Row>
      <Row style={{marginBottom: "6vh"}} type="flex" justify="center">
        <Col span={8} align="center">
            <AutoComplete style={{width: "100%"}} allowClear={true} onChange={props.onChange} onSelect={props.onSelect} dataSource={props.dataSource} placeholder="London, UK..."/>
        </Col>
      </Row>

      {props.locations.map((l) =>
        <Row key={l.name} type="flex" justify="center">
          <Button size="large" style={{marginTop: "0.5vh", marginBottom: "0.5vh", marginLeft: "0.5vh", marginRight: "0.5vh"}} onClick={() => props.onClick(l.name)} type="primary">{l.name}<Icon type="close"/></Button>
        </Row>)}

    </div>
  );
}

function ResultsViewer(props){
  return (
    <Row type="flex" justify="center">
      <Col span={24} align="center" >
        <Icon type="calendar" style={stepIcons}/>
        <p style={{marginBottom: "6vh"}}>Itinerary below!</p>
        <Map
            fitBounds={[[props.fitBounds.getSouthWest().lng(), props.fitBounds.getSouthWest().lat()], [props.fitBounds.getNorthEast().lng(), props.fitBounds.getNorthEast().lat()]]}
            fitBoundsOptions={{padding : 100}}
            style="mapbox://styles/mapbox/light-v9"
            containerStyle={{
              height: "60vh",
              width: "60vw"
            }}>
            {props.locations.map((l) => <Layer key={l.name} type="circle" paint={{"circle-radius": 8, "circle-color": l.color, "circle-opacity": 0.8}}>
              <Feature coordinates={[l.lng, l.lat]}/>
            </Layer>)}
            {props.locations.map(l => <Popup key={l.name} coordinates={[l.lng, l.lat]} anchor="bottom" offset={10}>
              <p style={{color: l.color}}>{l.day}</p>
            </Popup>)}
          </Map>
      </Col>
    </Row>
  );
}

class App extends Component {
  constructor(props){
    super(props);
    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.geoCoder = new google.maps.Geocoder()

    this.state = {
      currentStep: 0,
      daysTravelling: 5,
      predictedLocations: [],
      locations: []
    }
  }

  /*----------------------------FUNCTIONS FOR HANDLING DYNAMIC CHANGES--------------------------------------------------*/

  handleChangedDays = (value) => {
    this.setState({daysTravelling: value});
  }

  handleInputChange = (value) => {
    if(!value || !this.autocompleteService){
      return false;
    }
    this.autocompleteService.getPlacePredictions({input: value}, data => this.updatePredictedLocations(data));
  }

  updatePredictedLocations(data){
    if(!data || !data.length){
      return false;
    }
    this.setState({predictedLocations: data.map(place => place.description)})
  }

  handleAddLocation = (value) => {
    var locs = this.state.locations.map(l => l.name)
    if(locs.indexOf(value) > -1){
      message.error("Location already added!")
    }else{
      this.geoCoder.geocode({address: value}, data => this.updateLocations(data, value))
    }
  }

  updateLocations = (data, text) => {
    var loc = data[0].geometry.location;
    this.setState({locations: this.state.locations.concat({lat: loc.lat(), lng: loc.lng(), name: text})})
  }

  handleDeleteLocation = (value) => {
    var locations = this.state.locations.filter(loc => loc.name !== value);
    this.setState({locations: locations})
  }

  /*---------------------------------FUNCTIONS FOR CHANGING STEP PROGRESS--------------------------------------------------*/

  nextStep() {

    const currentStep = this.state.currentStep;
    if(currentStep===2){
      //Make sure enough locations added
      if(this.state.locations.length < this.state.daysTravelling){
         message.error('Please add at least ' + this.state.daysTravelling + " locations!");
         return;
     }
     //Get final locations and the corresponding bounding box for centering the map
     var finalLocations = cluster(this.state.locations, this.state.daysTravelling)
     var bounds = new google.maps.LatLngBounds();
     for(var i = 0; i<finalLocations.length; i++){
       var loc = finalLocations[i];
       bounds.extend({lat: loc.lat, lng: loc.lng})
     }
     this.setState({locations: finalLocations, finalBounds: bounds})
    }

    if(!(currentStep+1>3)){
      this.setState({ currentStep : currentStep+1});
    }
  }

  prevStep() {
    const currentStep = this.state.currentStep;
    if(!(currentStep-1<0)){
      this.setState({currentStep: currentStep-1})
    }
  }

  render() {
    if(this.state.currentStep===3){
      message.success("Itinerary generated!")
    }
    return (
      <div>
        <Hero/>
        <Row style={{marginTop: "8vh", marginBottom: "6vh"}} type="flex" justify="center">
          <Col span={8}>
            <ProgressBar current={this.state.currentStep}/>
          </Col>
        </Row>

        {this.state.currentStep ===0 && <WelcomePage/>}
        {this.state.currentStep === 1 && <DayPicker onChange={this.handleChangedDays} value={this.state.daysTravelling}/>}
        {this.state.currentStep === 2 && <LocationPicker onClick={this.handleDeleteLocation} onChange={this.handleInputChange} locations={this.state.locations} onSelect={this.handleAddLocation} dataSource={this.state.predictedLocations}/>}
        {this.state.currentStep === 3 && <ResultsViewer onMouseEnter={this.handleOnMouseEnter} fitBounds={this.state.finalBounds} locations={this.state.locations}/>}

        <Row style={{marginTop: "5vh"}} type="flex" justify="center">
          <Col span={12}>
            <Divider/>
          </Col>
        </Row>

        <Row style={{marginBottom: "10vh"}} type="flex" justify="center">
          <Col align="center" span={8}>
            <Button style={{marginRight: "2vh"}} disabled={this.state.currentStep === 0 ? true : false} onClick={() => this.prevStep()}>Back</Button>
            <Button disabled={this.state.currentStep === 3 ? true : false} onClick={() => this.nextStep()}>Next</Button>
          </Col>
        </Row>

      </div>

    );
  }
}

export default App;
