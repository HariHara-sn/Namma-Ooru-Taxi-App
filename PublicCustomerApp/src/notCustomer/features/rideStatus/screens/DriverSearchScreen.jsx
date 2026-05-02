import React from 'react';

import SearchLoader from '../component/SearchLoader';

import { cancelRide } from '../../../API/EndPoints/EndPoints';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import { showNotification } from '../../../components/NotificationManger';
import { useStackScreenStore } from '../../../store/useStackScreenStore';

const DriverSearchScreen = ({onCancel,onTripCancel}) => {
  const { tripId } = useCurrentRideInfoStore();
  const { goBack } = useStackScreenStore();
   
  return (
    <>
      <SearchLoader onCancel={onCancel} onTripCancel={onTripCancel} />
    </>
  );
};



export default DriverSearchScreen;
