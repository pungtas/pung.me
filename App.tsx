import * as API from '@zilliqa-js/zilliqa';
import * as Util from '@zilliqa-js/util';
import * as zcrypto from '@zilliqa-js/crypto';
import { Transaction } from '@zilliqa-js/account';
import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, Button} from 'react-native';
import tyronzil from './assets/tyronZIL.png';
import tyron from './assets/tyron.png'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import TyronZIL, { TransitionTag } from './src/tyronzil';

const CHAIN_ID = 333;
const ZILLIQA = new API.Zilliqa('https://dev-api.zilliqa.com/');
const VERSION = Util.bytes.pack(CHAIN_ID,1);
const INIT_TYRON = "0x63e2d8484187de4f66a571c098f3b51a793f055b";

type RootParamList = {
  "Log Into tyron.did": undefined
  "Donate $XSGD": { paramA: TyronZIL }
  //Screen3: { paramB: string; paramC: number }
}

const Root = createStackNavigator<RootParamList>()

type Screen1Props = StackScreenProps<RootParamList, "Log Into tyron.did">
const Screen1 = ({ navigation }: Screen1Props) => {
  const [username, setUserName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  return (
  <View style={styles.screen}>
    <Image source = {tyron} style = {styles.tyron}/> 
    <Text style = {styles.welcome}>
      Welcome to pung.me</Text>
    <Text style = {styles.welcome}>
      Your self-sovereign identity app to donate $XSGD on Zilliqa! </Text>
    <StatusBar style="auto" />
    <Text style={styles.title}>Log into testnet:</Text>      
    <TextInput
      value = {username}
      style = {styles.inputText}
      placeholder = "domain.did"
      onChangeText = {username => {
        setUserName(username)
      }}
    />
    <TextInput
      value = {privateKey}
      style = {styles.inputText}
      placeholder = "private key"
      onChangeText = {privateKey => {
        setPrivateKey(privateKey)
      }}
    />
    <Submit
      title = {`Log into ${username}`}
      onSubmission = {async() => {
        const didcAddr = await TyronZIL.resolve(ZILLIQA, INIT_TYRON, username);
        if(typeof didcAddr === "string"){
          const login = await TyronZIL.initialize(ZILLIQA, privateKey, username, didcAddr);
          if(login instanceof TyronZIL){
            navigation.push("Donate $XSGD", {paramA: login})
          } else {
            navigation.push("Log Into tyron.did")            
          }
        } else {
          alert!(didcAddr);
        }
        
      }}
    />      
  </View>
  )
}

function Submit({ title, onSubmission }) {
  return <TouchableOpacity onPress={onSubmission} style={styles.button}>
  <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
}

type Screen2Props = StackScreenProps<RootParamList, "Donate $XSGD">
const Screen2 = ({ navigation, route }: Screen2Props) => {
  const [campaign, setCampaign] = useState("");
  const [xsgdPrivateKey, setPrivateKey] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  
  return (
    <View style={styles.screen}>
    <Image source = {tyronzil} style = {styles.tyronzil}/> 
    <Text style={styles.title}>Donate $XSGD</Text>
    <TextInput
        value = {campaign}
        style = {styles.inputText}
        placeholder = "campaign code"
        onChangeText = {campaign => {
          setCampaign(campaign)
        }}
      />
    <TextInput
      value={xsgdPrivateKey}
      style={styles.inputText}
      placeholder="XSGD private key"
      onChangeText={xsgdPrivateKey => {
        setPrivateKey(xsgdPrivateKey)
      }}
    />
    <TextInput
      value={recipient}
      style={styles.inputText}
      placeholder="recipient.did"
      onChangeText={recipient => {
        setRecipient(recipient)
      }}
    />
    <TextInput
      value={amount}
      style={styles.inputText}
      placeholder="amount of $XSGD"
      onChangeText={amount => {
        setAmount(amount)
      }}
    />
    <Submit
        title = {`Donate to ${recipient}`}
        onSubmission = {async() => {
          const recipient_didAddr = await TyronZIL.resolve(ZILLIQA, INIT_TYRON, recipient);
          if(typeof recipient_didAddr === "string"){
            const xsgd_privateKey = zcrypto.normalizePrivateKey(xsgdPrivateKey);
            const xsgd_publicKey = zcrypto.getPubKeyFromPrivateKey(xsgd_privateKey);
            const to_addr = zcrypto.fromBech32Address(recipient_didAddr).substring(2);
            const SIGNATURE = "0x"+ zcrypto.sign(Buffer.from(to_addr, 'hex'), xsgd_privateKey, xsgd_publicKey);
            
            const transition_params = await TyronZIL.xTransfer(campaign, "pungtas", zcrypto.fromBech32Address(recipient_didAddr), String(Number(amount)*1e6), SIGNATURE)
            
            const donation = await TyronZIL.submit(TransitionTag.XTransfer, ZILLIQA, VERSION, route.params.paramA, transition_params);
            navigation.push("Log Into tyron.did")
          } else {
            alert!(recipient_didAddr)
          }
        }}
    />
    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Root.Navigator>
        <Root.Screen name = "Log Into tyron.did" component = {Screen1} />
        <Root.Screen name = "Donate $XSGD" component = {Screen2} />
      </Root.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  screen: {
    marginTop: 40,
    alignItems: 'center'
  },
  title: {
    padding: 30,
    fontSize: 35,
    color: '#008080'
  },
  tyron: {
    width: 350,
    height: 350,
    marginBottom: 5,
  },
  tyronzil: {
    width: 305,
    height: 159,
    marginBottom: 5,
  },
  welcome: {
    color: '#006400',
    fontSize: 22,
    marginBottom: 10
  },
  button: {
    marginTop: 30,
    backgroundColor: '#008080',
    padding: 30,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 25,
    color: '#fff',
  },
  inputText: {
    fontSize: 20,
    color: 'steelblue',
    marginBottom: 20,  
  }
});
