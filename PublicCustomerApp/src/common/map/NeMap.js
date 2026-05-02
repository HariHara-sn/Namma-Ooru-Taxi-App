/* eslint-disable no-unused-vars */
/* eslint-disable react/self-closing-comp */
import React, { Component, PureComponent } from 'react';
import { NativeModules, requireNativeComponent, View } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import PropsTypes from 'prop-types';
import { useMapMarkerStore } from '../store/useMapMarkerStore';

const MapView = requireNativeComponent('NeNativeModule'); // Use the module name defined in your native module

const defaultStyle = {
  height: '99%',
  width: '100%',
};

const {NeNativeModule} = NativeModules;

class NEMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapLoaded: false,
      loadMap: false,
      resizeDone: false,
      resolvedHomeLocation: null,
    };
    this.homeLocationTimer = null;
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

  defaultHomeLocation() {
    return {
      lat: 13.0827,
      lng: 80.2707,
      zoom: 6,
    };
  }

  resolveHomeLocationPayload(homeLocation) {
    const candidate = Array.isArray(homeLocation)
      ? homeLocation.filter(Boolean)
      : homeLocation
      ? [homeLocation]
      : [];

    if (candidate.length === 0) {
      return [this.defaultHomeLocation()];
    }

    return candidate.map(location => ({
      ...this.defaultHomeLocation(),
      ...(location || {}),
    }));
  }

  hasHomeLocationChanged(previousLocation, nextLocation) {
    if (previousLocation === nextLocation) {
      return false;
    }

    const normalize = value => {
      if (Array.isArray(value)) {
        return value.filter(Boolean)[0] || null;
      }
      return value || null;
    };

    const prevLoc = normalize(previousLocation);
    const nextLoc = normalize(nextLocation);

    if (!prevLoc && !nextLoc) {
      return false;
    }

    if (!prevLoc || !nextLoc) {
      return true;
    }

    const prevLat = prevLoc.lat ?? prevLoc.latitude;
    const prevLng = prevLoc.lng ?? prevLoc.longitude;
    const nextLat = nextLoc.lat ?? nextLoc.latitude;
    const nextLng = nextLoc.lng ?? nextLoc.longitude;

    if (prevLat !== nextLat || prevLng !== nextLng) {
      return true;
    }

    const prevZoom = prevLoc.zoom;
    const nextZoom = nextLoc.zoom;
    const prevMaxZoom = prevLoc.maxZoom;
    const nextMaxZoom = nextLoc.maxZoom;

    return prevZoom !== nextZoom || prevMaxZoom !== nextMaxZoom;
  }

  clearHomeLocationTimer() {
    if (this.homeLocationTimer) {
      clearTimeout(this.homeLocationTimer);
      this.homeLocationTimer = null;
    }
  }

  scheduleHomeLocationUpdate(homeLocation) {
    this.clearHomeLocationTimer();

    if (!this.state.mapLoaded) {
      if (this.state.resolvedHomeLocation !== null) {
        this.setState({ resolvedHomeLocation: null });
      }
      return;
    }

    this.homeLocationTimer = setTimeout(() => {
      this.setState(currentState => {
        if (!currentState.mapLoaded) {
          return { resolvedHomeLocation: null };
        }
        return {
          resolvedHomeLocation: this.resolveHomeLocationPayload(homeLocation),
        };
      });
      this.homeLocationTimer = null;
    }, 200);
  }

  triggerResize() {
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        resizeDone: true,
      }));
    }, 100);
  }

  triggerResizeNav() {
    this.setState(prevState => ({
      ...prevState,
      resizeDone: false,
    }));
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        resizeDone: true,
      }));
    }, 4000);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        loadMap: true,
        resizeDone: false,
      }));
    }, 100);

    this.navigationReadyListener = DeviceEventEmitter.addListener("onNavigationReady", () => {
      if (this.props.onMapReady) {
        this.props.onMapReady();
      }
      // Set Map loaded to true
      setTimeout(() => {
        this.setState(prevState => ({
          ...prevState,
          mapLoaded: true
        }), () => {
          this.triggerResizeNav();
        });
      }, 100)

      console.log("Navigation, Map LOADED TRUE")


    });
    
    /* Trigger map ready callback */
    this.mapReadyListener = DeviceEventEmitter.addListener('onMapReady', () => {
      // Set Map loaded to true
      this.setState(prevState => ({
        ...prevState,
        mapLoaded: true,
      }), () => {
        if (this.props.onMapReady) {
          this.props.onMapReady();
        }

        this.triggerResize();
      });
    });

    this.mapClickListener = DeviceEventEmitter.addListener(
      'onMapClick',
      data => {
        const fixedData = {
          longitude: parseFloat(data.longitude.toFixed(5)),
          latitude: parseFloat(data.latitude.toFixed(5)),
        };
        this.props.onMapClick ? this.props.onMapClick(fixedData) : null;
      },
    );

    this.userLocationChangeListener = DeviceEventEmitter.addListener(
      'onUserLocationChange',
      data => {
        const fixedData = {
          longitude: parseFloat(data.longitude.toFixed(5)),
          latitude: parseFloat(data.latitude.toFixed(5)),
        };
        this.props.onUserLocationChange
          ? this.props.onUserLocationChange(fixedData)
          : null;
      },
    );

    this.searchResultsListener = DeviceEventEmitter.addListener(
      'onSearchResults',
      (data) => {
        this.props.onSearchResults?.(data);
      }
    )

    this.routeNotFoundError = DeviceEventEmitter.addListener(
      'onNavigationRouteNotFoundError',
      (data) => {
        this.props.routeNotFound?.(data);
      }
    )

    this.searchPOIResultListener = DeviceEventEmitter.addListener(
      'onSearchPOIResults',
      (data) => {
        console.log("SEARCH POI RESULTS", data)
        this.props.onSearchPOIResults?.(data);
      }
    )

    this.searchPOIErrorListener = DeviceEventEmitter.addListener(
      'onSearchPOIError',
      (data) => {
        console.log("SEARCH POI Error", data)
        this.props.onSearchPOIError?.(data);
      }
    )


    this.directionReadyListener = DeviceEventEmitter.addListener(
      'direction-ready',
      data => {
        this.props.onDirectionReady ? this.props.onDirectionReady(data) : null;
      },
    );
    this.directionInitListener = DeviceEventEmitter.addListener(
      'direction-init',
      data => {
        this.props.onDirectionInit ? this.props.onDirectionInit(data) : null;
      },
    );

    this.routeLoadingListener = DeviceEventEmitter.addListener(
      'route-loading',
      data => {
        // Guard against non-function prop (error reported earlier)
        this.invokeIfFunc('onRouteLoading', data);
      },
    );

    this.nativeErrorListener = DeviceEventEmitter.addListener(
      'onNativeError',
      data => {
        this.props.onNativeError ? this.props.onNativeError(data) : null;
      },
    );

    this.navigationErrorListener = DeviceEventEmitter.addListener(
      'onNavigationError',
      data => {
        this.props.onNavigationError ? this.props.onNavigationError(data) : null;
      },
    );

    this.distanceListner = DeviceEventEmitter.addListener(
      'navigationLocation',
      data => {
        this.props.distanceListner ? this.props.distanceListner(data) : null
      },
    );

    this.markerClickListener = DeviceEventEmitter.addListener(
      'onMarkerClick',
      (data) => {
        this.props.onMarkerClick ? this.props.onMarkerClick(data) : null;
      }
    )

    this.onMapDblclickListener = DeviceEventEmitter.addListener(
      'onMapDblclick',
      (data) => {
        this.props.onMapDblclick ? this.props.onMapDblclick(data) : null;
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
      // Removed duplicate 'route-loading' listener that caused confusion and type errors.
  }

  componentWillUnmount() {
    const {setStartNavigation, setDisduration, setDirectionReadyCallback, setDirectionPoints} = useMapMarkerStore.getState()
    console.log("Map unmounted")
    this.clearHomeLocationTimer();
    // Don't forget to remove the listener to avoid memory leaks
    this.mapReadyListener.remove();
    this.mapClickListener.remove();
    this.userLocationChangeListener.remove();
    this.directionReadyListener.remove();
    this.directionInitListener.remove();
    this.routeLoadingListener && this.routeLoadingListener.remove();
    this.nativeErrorListener.remove();
    this.navigationErrorListener.remove();
    this.markerClickListener.remove();
    this.onMapDblclickListener.remove();
    this.navigationReadyListener.remove();
    this.distanceListner.remove();
    NeNativeModule.endNavigation();
   
    setStartNavigation(false)
    setDisduration(null)
    setDirectionReadyCallback(null)
    setDirectionPoints(null)
  }
  getmapReady() {
    return this.state.mapLoaded;
  }

  componentDidUpdate(prevProps, prevState) {
    const homeLocationChanged = this.hasHomeLocationChanged(prevProps.homeLocation, this.props.homeLocation);
    if (this.state.mapLoaded && (!prevState.mapLoaded || homeLocationChanged)) {
      this.scheduleHomeLocationUpdate(this.props.homeLocation);
    }
  }

  render() {

    // const defaultSettings = {
    //   gpsReliability: 'Medium',
    //   navAccuracy: 'Medium',
    //   mapAppearance: 'Regular',
    //   highways: 'Prefer',
    //   tolls: 'Prefer',
    //   ferry: 'Prefer',
    //   livingStreet: 'Prefer',
    //   distanceFormate: 'Kilometers(km)/ Meters(m)',
    //   enableDarkTheme: false,
    //   enableExtrusions: false,
    //   enable3D: false,
    //   language:'en'
    // };

    return this.state.loadMap ? (
      <>
        <MapView
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
          geometries={this.state.mapLoaded ? this.props.geometries : null}
          findRoute={
            this.state.mapLoaded && this.props.findRoute?.length !== 0
              ? this.props.findRoute
              : null
          }
          findRouteWithRequest={
            this.state.mapLoaded && this.props.findRouteWithRequest?.length !== 0
              ? this.props.findRouteWithRequest
              : null
          }
          bounds={this.state.mapLoaded? this.props.bounds : null}
          navigation={this.props.navigation}
          settingsProps={this.props.settingsProps }
          searchUnit={this.props.searchUnit}
          vehicleMarkers={
            this.state.mapLoaded && this.props.vehicleMarkers?.length !== 0
              ? this.props.vehicleMarkers
              : null
          }
        />
      </>
    ) : (
      <View></View>
    );
  }
}

NEMap.defaultProps = {
  mapStyle: defaultStyle,
  markers: [],
  polylines: [],
  findRoute: {},
  onMapReady: null,
  onMapClick: null,
  onUserLocationChange: null,
  homeLocation: null,
  navigation: false,
  updateMapLoaded: () => { },
  onDirectionReady: () => { },
  onDirectionInit: () => { },
  onRouteLoading: () => { },
  onNativeError: () => { },
  onNavigationError: () => { }
};

NEMap.propTypes = {
  mapStyle: PropsTypes.object,
  markers: PropsTypes.array,
  polylines: PropsTypes.array,
  findRoute: PropsTypes.object,
  onMapReady: PropsTypes.func,
  onMapClick: PropsTypes.func,
  onUserLocationChange: PropsTypes.func,
  homeLocation: PropsTypes.object,
  navigation: PropsTypes.bool,
  updateMapLoaded: PropsTypes.func,
  onDirectionReady: PropsTypes.func,
  onDirectionInit: PropsTypes.func,
  onRouteLoading: PropsTypes.func,
  onNativeError: PropsTypes.func,
  onNavigationError: PropsTypes.func,
  settingsProps: PropsTypes.object,
  vehicleMarkers: PropsTypes.array,
  findRouteWithRequest: PropsTypes.array,
};

export default NEMap;
