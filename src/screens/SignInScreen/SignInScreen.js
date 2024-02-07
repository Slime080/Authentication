import React, { useState } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import Logo from '../../../assets/images/Log_1.png';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import SQLite from 'react-native-sqlite-storage';

const SignInScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { height } = useWindowDimensions();

  const db = SQLite.openDatabase(
    {
      name: 'my.db',
      location: 'default',
    },
    () => console.log('Database opened successfully'),
    error => console.error('Error opening database:', error)
  );

  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)',
      [],
      () => {
        console.log('Table created successfully');
        // Inserting the default user into the table
        tx.executeSql(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          ['KurtManuel', 'Tiger123'],
          () => console.log('Default user inserted successfully'),
          error => console.error('Error inserting default user:', error)
        );
      },
      error => console.error('Error creating table:', error)
    );
  });

  const onSignInPressed = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            Alert.alert('Success', 'Login successful');
          } else {
            Alert.alert('Error', 'Invalid username or password');
          }
        },
        (_, error) => {
          console.error('Error executing SQL:', error);
          Alert.alert('Error', 'An error occurred. Please try again.');
        }
      );
    });
  };

  return (
    <View style={styles.root}>
      <Image source={Logo} style={[styles.logo, { height: height * 0.3 }]} resizeMode="contain" />

      <CustomInput placeholder="Username" value={username} setValue={setUsername} />
      <CustomInput placeholder="Password" value={password} setValue={setPassword} secureTextEntry />
      <CustomButton text="Sign in" onPress={onSignInPressed} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    padding: 20,
  },
  
  logo: {
    width: 150,
    maxWidth: 300,
    maxHeight: 200,
  },
});

export default SignInScreen;
