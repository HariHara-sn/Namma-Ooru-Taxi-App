/* eslint-disable no-unused-vars */
/* eslint-disable react/self-closing-comp */
import React, { Component } from 'react';
import { requireNativeComponent, View } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import PropTypes from 'prop-types';
import { NativeModules } from 'react-native';
import useMapStore from '../../features/map/store/useMapStore';
// This component wraps a native map module called 'NeNativeModule' and provides a React interface to it
// Memoize native view registration to prevent duplicate "Tried to register two views" errors
// global.__NE_NATIVE_MAP_VIEW__ = global.__NE_NATIVE_MAP_VIEW__ || requireNativeComponent('NeNativeModule');
// const MapView = global.__NE_NATIVE_MAP_VIEW__;
// const { NeNativeModule } = NativeModules;

// Default styling for the map view
const defaultStyle = {
  height: '99%', 
  width: '100%',
};

class NEMap extends Component {
  constructor(props) {
    super(props);
    // Track map loading state and resize state
    this.state = {
      mapLoaded: false, // Whether native map is fully loaded
      loadMap: false,   // Whether to render map component
      resizeDone: false // Whether resize animation is complete
    };
    this.getmapReady = this.getmapReady.bind(this);
     this.invokeIfFunc = this.invokeIfFunc.bind(this);
  }



  invokeIfFunc(propName, data) {
    const candidate = this.props[propName];
    if (typeof candidate === 'function') {
      try {
        candidate(data);
      } catch (err) {
        if (__DEV__) {
          console.warn(`NEMap: error invoking ${propName}:`, err);
        }
      }
    } else if (__DEV__ && candidate !== undefined) {
      console.warn(
        `NEMap: '${propName}' prop expected a function but received ${typeof candidate}. Event ignored.`,
      );
    }
  }
  
  // Trigger map resize after short delay
  triggerResize() {
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        resizeDone: true,
      }));
    }, 100);
  }

  // Special resize handling for navigation mode
  triggerResizeNav() {
    this.setState(prevState => ({
      ...prevState, 
      resizeDone: false
    }));
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        resizeDone: true,
      }));
    }, 4000);
  }

  componentDidMount() {
  
    // Initialize map after short delay
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        loadMap: true,
        resizeDone: false,
      }));
    }, 100);

    // Set up event listeners for map events from native code
    this.mapReadyListener = DeviceEventEmitter.addListener('onMapReady', () => {

      this.setState(prevState => ({
        ...prevState,
        mapLoaded: true,
      }));
      this.props.onMapReady?.();
      this.triggerResize();
    });

    // Navigation ready event handling (do not flip mapLoaded here)
    this.navigationReadyListener = DeviceEventEmitter.addListener("onNavigationReady", () => {
      this.props.onMapReady?.();
      setTimeout(() => {
        this.triggerResizeNav()
      }, 100)
    });

    // Map click event - provides lat/lng coordinates
    this.mapClickListener = DeviceEventEmitter.addListener(
      'onMapClick',
      (data) => {
        const fixedData = {
          longitude: parseFloat(data.longitude.toFixed(5)),
          latitude: parseFloat(data.latitude.toFixed(5)),
        };
        this.props.onMapClick?.(fixedData);
      },
    );

    // User location updates
    this.userLocationChangeListener = DeviceEventEmitter.addListener(
      'onUserLocationChange',
      (data) => {
        this.props.onUserLocationChange?.(data);
      },
    );

    this.routeLoadingListener = DeviceEventEmitter.addListener(
      'route-loading',
      data => {
        // Guard against non-function prop (error reported earlier)
        this.invokeIfFunc('onRouteLoading', data);
      },
    );

    // Route/navigation related events
    this.directionReadyListener = DeviceEventEmitter.addListener(
      'direction-ready',
      data=> {
        this.props.onDirectionReady?.(data);
      },
    );

    this.directionInitListener = DeviceEventEmitter.addListener(
      'direction-init',
      data => {
        this.props.onDirectionInit?.(true);
      },
    );

    this.distanceListner = DeviceEventEmitter.addListener(
      'navigationLocation',
      data => {
        this.props.distanceListner?.(data);
      },
    );

    // Marker interaction events
    this.markerClickListener = DeviceEventEmitter.addListener(
      'onMarkerClick',
      (data) => {
        this.props.onMarkerClick?.(data);
      }
    )

    this.onMapDblclickListener = DeviceEventEmitter.addListener(
      'onMapDblclick',
      (data) => {
        this.props.onMapDblclick?.(data);
      }
    )

    // Search related events
    this.searchResultsListener = DeviceEventEmitter.addListener(
      'onSearchResults',
      (data) => {
        this.props.onSearchResults?.(data);
      }
    )

    this.searchPOIResultListener = DeviceEventEmitter.addListener(
      'onSearchPOIResults',
      (data) => {
        
        this.props.onSearchPOIResults?.(data);
      }
    )

    this.searchPOIErrorListener = DeviceEventEmitter.addListener(
      'onSearchPOIError',
      (data) => {
        
        this.props.onSearchPOIError?.(data);
      }
    )

    // Map movement/position events
    this.mapCenterListener = DeviceEventEmitter.addListener(
      'onMapCenterChanged',
      (data) => {
        this.props.onMapCenterChanged?.(data);
      }
    )

    this.mapMovingListener = DeviceEventEmitter.addListener(
      'onMapRotationChanged',
      (data) => {
        this.props.onMapRotationChanged?.(data);
      }
    )

    // Navigation end events
    this.onNavigationEndListener = DeviceEventEmitter.addListener(
      'navigation',
      (data) => {
        this.props.onNavigationEnd?.(data);
      }
    )

    this.navigationEndUIListener = DeviceEventEmitter.addListener(
      'navigationEnd',
      (data) => {
        console.log("Navigation End UI", data)
      }
    )
  }

  // Clean up event listeners
  componentWillUnmount() {
    this.mapReadyListener.remove();
    this.mapClickListener.remove();
    const {setDirectionPoints, setFindRouteWithRequest} = useMapStore.getState()
    console.log("Map unmounted")
    // Don't forget to remove the listener to avoid memory leaks
    this.mapReadyListener.remove();
    this.mapClickListener.remove();
    this.userLocationChangeListener.remove();
     this.routeLoadingListener && this.routeLoadingListener.remove();
    this.directionReadyListener.remove();
    this.directionInitListener.remove();
    this.markerClickListener.remove();
    this.onMapDblclickListener.remove();
    this.navigationReadyListener.remove();
    this.distanceListner.remove();
   
  
    setDirectionPoints(null)
    setFindRouteWithRequest?.(null)
  }

  getmapReady() {
    return this.state.mapLoaded;
  }

  // Handle marker updates by triggering resize
  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.markers !== this.props.markers) {
      this.setState(prevState => ({
        ...prevState,
        resizeDone: !prevState.resizeDone,
      }));
    }
  };

  // Method to remove markers
  removeMarkers(markerIds) {
    console.log("markerIds", markerIds)
    // NeNativeModule.removeMarkers(markerIds);
  }

  render() {
    return this.state.loadMap ? (
      <>
        {/* <MapView
          style={this.state.resizeDone ? this.props.mapStyle : defaultStyle}
          markers={this.state.mapLoaded ? this.props.markers : null}
          homeLocation={
            this.state.mapLoaded
              ? [
                this.props.homeLocation || {
                  lat: 13.0827,
                  lng: 80.2707,
                  zoom: 6,
                },
              ]
              : null
          }
          autoPOISearch={this.props.autoPOISearch}
          {...(this.state.mapLoaded ? { mode: this.props.mode } : {})}
          settingsProps={this.props.settingsProps}
          searchUnit={this.props.searchUnit}
          geometries={this.state.mapLoaded ? this.props.geometries : null}
          findRoute={
            this.state.mapLoaded && this.props.findRoute?.length !== 0
              ? this.props.findRoute
              : null
          }
          vehicleMarkers={
            this.state.mapLoaded && this.props.vehicleMarkers?.length !== 0
              ? this.props.vehicleMarkers
              : null
          }
          navigation={this.props.navigation}
          {...(this.state.mapLoaded ? { bounds: this.props.bounds } : {})}
        /> */}
      </>
    ) : (
      <View></View>
    );
  }
}

// PropTypes define the expected props and their types
NEMap.propTypes = {
  onMapReady: PropTypes.func,
  onMapClick: PropTypes.func,
  onUserLocationChange: PropTypes.func,
  onDirectionReady: PropTypes.func,
  onDirectionInit: PropTypes.func,
  distanceListner: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onMapDblclick: PropTypes.func,
  onSearchResults: PropTypes.func,
  onSearchPOIResults: PropTypes.func,
  onSearchPOIError: PropTypes.func,
  onMapCenterChanged: PropTypes.func,
  onMapRotationChanged: PropTypes.func,
  onNavigationEnd: PropTypes.func,
  mapStyle: PropTypes.object,
  markers: PropTypes.array,
  vehicleMarkers: PropTypes.array,
  homeLocation: PropTypes.object,
  autoPOISearch: PropTypes.bool,
  mode: PropTypes.string,
  settingsProps: PropTypes.object,
  searchUnit: PropTypes.string,
  geometries: PropTypes.array,
  findRoute: PropTypes.array,
  onRouteLoading: PropTypes.func,
  navigation: PropTypes.object,
  bounds: PropTypes.array,
};

export default NEMap;
