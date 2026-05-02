import {useEffect} from 'react';
import {BackHandler} from 'react-native';
import PropTypes from 'prop-types';

const UseBackButton = ({onBackPress}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return true;
    }
    return false; 
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  return null;
};

export default UseBackButton;

UseBackButton.propTypes = {
  onBackPress: PropTypes.func,
};

UseBackButton.defaultProps = {
  onBackPress: () => {}
};
