import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { View, Text, Image, StyleSheet } from 'react-native';

const Pulse = ({
  color = '#dedef1',
  diameter = 400,
  duration = 1000,
  initialDiameter = 0,
  numPulses = 3,
  pulseStyle = {},
  speed = 10,
  style = {
    top: 0,
    bottom: 300,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
}) => {
  const [pulses, setPulses] = useState([]);
  const [started, setStarted] = useState(false);
  const maxDiameter = diameter;

  const createPulseTimer = useRef(null);
  const intervalTimer = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    setStarted(true);

    let a = 0;
    while (a < numPulses) {
      createPulseTimer.current = setTimeout(() => {
        createPulse(a);
      }, a * duration);
      a++;
    }

    intervalTimer.current = setInterval(() => {
      updatePulse();
    }, speed);

    return () => {
      mounted.current = false;
      clearTimeout(createPulseTimer.current);
      clearInterval(intervalTimer.current);
    };
  }, []);

  const createPulse = (pKey) => {
    if (mounted.current) {
      setPulses((prevPulses) => [
        ...prevPulses,
        {
          pulseKey: prevPulses.length + 1,
          diameter: initialDiameter,
          opacity: 0.5,
          centerOffset: (maxDiameter - initialDiameter) / 2,
        },
      ]);
    }
  };

  const updatePulse = () => {
    if (mounted.current) {
      setPulses((prevPulses) =>
        prevPulses.map((p, i) => {
          let newDiameter = p.diameter > maxDiameter ? 0 : p.diameter + 2;
          let centerOffset = (maxDiameter - newDiameter) / 2;
          let opacity = Math.abs(newDiameter / maxDiameter - 1);

          return {
            pulseKey: i + 1,
            diameter: newDiameter,
            opacity: opacity > 0.5 ? 0.5 : opacity,
            centerOffset: centerOffset,
          };
        })
      );
    }
  };

  const containerStyle = [styles.container, style];
  const pulseWrapperStyle = { width: maxDiameter, height: maxDiameter };

  return (
    <View style={containerStyle}>
      {started && (
        <View style={pulseWrapperStyle}>
          {pulses.map((pulse) => (
            <View
              key={pulse.pulseKey}
              style={[
                styles.pulse,
                {
                  backgroundColor: color,
                  width: pulse.diameter,
                  height: pulse.diameter,
                  opacity: pulse.opacity,
                  borderRadius: pulse.diameter / 2,
                  top: pulse.centerOffset,
                  left: pulse.centerOffset,
                },
                pulseStyle,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

Pulse.propTypes = {
  color: PropTypes.string,
  diameter: PropTypes.number,
  duration: PropTypes.number,
  image: PropTypes.object,
  initialDiameter: PropTypes.number,
  numPulses: PropTypes.number,
  pulseStyle: PropTypes.object,
  speed: PropTypes.number,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    flex: 1,
  },
});

export default Pulse;
