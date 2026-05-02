import Config from 'react-native-config';

const formatAddress = (data) => {
  try {
    if (!data || typeof data !== "object") throw new Error("Invalid input");

    const { placeName, address } = data;

    // Collect non-empty values
    const parts = [];
    if (placeName) parts.push(placeName);
    if (Array.isArray(address)) {
      parts.push(...address.filter(x => x && x.trim() !== ""));
    }
    // Join into string
    return parts.length > 0 ? parts.join(", ") : "Address not available";
  } catch (err) {
    return `Error formatting address: ${err.message}`;
  }
}

class SearchAPI {
  constructor(accessToken = Config.NE_ACCESS_TOKEN) {
    this.accessToken = accessToken;

    this.searchAbortController = null;
  }

  async search(locationName) {
    if (this.searchAbortController) this.searchAbortController.abort();
    this.searchAbortController = new AbortController();

    const searchText = locationName;

    const response = await fetch(
      `${Config.NE_ROOT_URL}/search/api?access_token=${this.accessToken}&q=${searchText}&lang=en&limit=10`,
      {signal: this.searchAbortController.signal},
    );
    const data = await response.json();

    return data;
  }

  async reverseGeocode(location, onlyAddress = false) {
    if (this.searchAbortController) this.searchAbortController.abort();
    this.searchAbortController = new AbortController();

    const longitude = location[1],
      latitude = location[0];
    const response = await fetch(
      `${Config.NE_ROOT_URL}/search/reverse?access_token=${this.accessToken}&lat=${latitude}&lon=${longitude}`,
      {signal: this.searchAbortController.signal},
    );

    const data = await response.json();
    const {features} = data;
    /* Return the best result */
    if (onlyAddress) {
      const {properties} = features[0];
      const {name, city, state, country} = properties;
      const parts = [name, city, state, country];
      const place = parts.filter(Boolean).join(', ');
      return place;
    }
    return features[0];
  }

  async reverseGeocodeV2(location, onlyAddress = false) {
    if (this.searchAbortController) this.searchAbortController.abort();
    this.searchAbortController = new AbortController();
    
    const longitude = location[1];
    const latitude = location[0];
    const searchData = {
      addDebugInfo: false,
      input: `${longitude},${latitude}`,
      language: 'en',
      limitResults: 10,
      mapunit: 'india',
      sections: ['reverse_geocode'],
      userPos: [latitude, longitude],
      version: '1.2.0.0',
    };

    const response = await fetch(
      `${Config.REVERSE_GEOCODE}?data=${JSON.stringify(searchData)}`,
      {signal: this.searchAbortController.signal},
    );

 
    const data = await response.json();

    let {reverse_geocode} = data;

    if (reverse_geocode && reverse_geocode.length > 0) {
      const addressData = reverse_geocode[0].address;
      const placeName = reverse_geocode[0].place_name[0];

      const res = {};
      if (
        Array.isArray(addressData) &&
        addressData.filter(item => item !== '').length > 0
      ) {
        res.address = addressData;
      }

      if (placeName) {
        res.placeName = placeName;
      } else {
        res.placeName = 'Unnamed Location';
      }
      return formatAddress(res);
    }else{
      return formatAddress({address: [], placeName: 'Unnamed Location'});
    }

  }
}

export default SearchAPI;
