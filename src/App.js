import React from 'react';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ApolloProvider, Query, Mutation } from "react-apollo";
import ApolloClient from "apollo-boost";

import {QueryGetTopNUsers, CREATE_USER, UPDATE_USER, QueryGetAllUsersSorted, QueryGetAllUsers, QueryGetUserById} from './Queries';

const log = (st) => console.log(st);

const getLocalStorage = () => {
    let ret;
    try{
        ret = JSON.parse(localStorage.getItem("gameXYZstate")) || {};
    }catch(err){
        console.log("Error parsing localStorage");
        localStorage.setItem("gameXYZstate", JSON.stringify("{}"))
        ret = {}
    }
    return ret;
};

const setLocalStorage = (newLocalState) => {
    console.assert(newLocalState, "null or undefined");
    const lastStorage = getLocalStorage();
    for(let k in newLocalState)
        lastStorage[k] = newLocalState[k];
    localStorage.setItem("gameXYZstate", JSON.stringify(lastStorage));
};

var isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.0/8 are considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
  );

isLocalhost = false;

let GRAPHQL_SERVER = "http://34.72.71.11:8080/graphql";
if(isLocalhost)
        GRAPHQL_SERVER = "http://localhost:8080/graphql";

console.log("GRAPHQL_SERVER: ", GRAPHQL_SERVER);
const client = new ApolloClient({ uri: GRAPHQL_SERVER });

class ScoreBoard extends React.Component{

    buildTableRow(userList){
        return userList.map((e, idx) => <tr key={e.id}>
                <td>{idx}</td>
                <td>{e.name}</td>
                <td>{e.score}</td>
            </tr> );
    }

    render(){
        return(
            <ApolloProvider client={client}>
            <div>
              <h3>Score Board</h3>
              <Query query={QueryGetAllUsersSorted}>
                {props => {
                    const { error, loading, data } = props;
                    if (error) return <div>ERROR -> {JSON.stringify(error)}</div>;
                    if (loading) return <div>LOADING...</div>;
                    if (!data && !data.users) return <div>No User Found!</div>;
                    return (
                        <table>
                            <thead><tr><th>Rank</th><th>Name</th><th>Score</th></tr></thead>
                            <tbody>{this.buildTableRow(data.users)}</tbody>
                        </table>
                    );
                }}
              </Query>
            </div>
          </ApolloProvider>

        );
    }
}

class Game extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            name: this.props.name,
            id: this.props.id,
            score: this.props.score || 0,
            lastEarned: 0
        }
    }

    getRandomPoints(){
        const earnedPoints = Math.floor(Math.random()*100);
        return earnedPoints;
    }

    updateLocalStorage(){
        setLocalStorage(this.state);
        this.props.onScoreChange(this.state.score)
    }

    pointsEarned(){
        if(this.state.score)
            return (<label>Your earned {this.state.lastEarned} points</label>);
        return null;
    }

    testme(updateUser){
        this.setState({lastEarned: this.getRandomPoints()})
        updateUser();
    }

    render(){
        return (
            <div>
                <div>
                    <br/><br/>
                    {this.pointsEarned()}
                </div>
                <div>
                    <ApolloProvider client={client}>
                    <Mutation mutation={UPDATE_USER}
                        onCompleted={(data)=> {

                            if(!data) { setLocalStorage({}); this.setState({id: null}); return; }

                            toast(`🦄 You earned ${this.state.lastEarned} points`)
                            this.setState({score: data.user.score}, () => this.updateLocalStorage())
                        }}
                        variables = {{id: this.state.id, score: this.state.lastEarned}}>
                            {updateUser => <button onClick={ () => this.testme(updateUser) }>Spin</button> } 
                    </Mutation>
                    </ApolloProvider>
                </div>
            </div>
        );
    }
}

class Timer extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            timeElapsed : 0,
        }
    }

    tick(){
        this.setState({
            timeElapsed: Math.floor((new Date() - this.startTime)/1000),
        });
    }

    componentDidMount(){
        this.startTime = new Date();
        this.timerId = setInterval( () => this.tick(), 1000);
    }

    componentWillUnmount(){
        clearInterval(this.timerId);
    }

    render(){
        return(
            <div>{this.state.timeElapsed} seconds</div>
        );
    }
}

class GameBoard extends React.Component {
    constructor(props){
        super(props)

        const localState = getLocalStorage();

        this.state = {
            name: localState.name,
            id: localState.id,
            totalScore: 0
        }
    }

    render(){
        // if the local storage does not have a id, then register the user and get the id
        if(!this.state.id){
            return(
                <div>
                    <h1>Game</h1>
                    <input type="text" name="name" value={this.state.name} onChange={ e => this.setState({tmpName : e.target.value}) }/>
                    <ApolloProvider client={client}>
                    <Mutation mutation={CREATE_USER}
                        onCompleted={ data => {
                            this.setState({ id: data.user.id,  name: data.user.name}, () => setLocalStorage(this.state)); 
                        } }
                        variables = {{name: this.state.tmpName}}>
                            {x => <button onClick={x}>Set Name</button> }
                    </Mutation>
                    </ApolloProvider>
                </div>
            );
        }
        
        return(
            <div>
                <h1>Game</h1>
                <label>Welcome {this.state.name}</label>
                <br/>
                
                <ApolloProvider client={client}>
                <Query query={QueryGetUserById} variables={{id: this.state.id}} 
                onCompleted={ data => {
                    if(data && data.user)
                        this.setState({totalScore: data.user.score})
                }}> 
                { props => {
                    const {error, loading, data} = props;
                    if(error) return (<div>Error {JSON.stringify(error)}</div>);
                    if(loading) return (<div>Loading...</div>);
                    if(!data && !data.user) return (<div>000</div>);
                    // console.log(data);
                    return <label>Your total score is {this.state.totalScore}</label>;
                    
                }}
                </Query>
                </ApolloProvider>

                <Game 
                    id={this.state.id} onScoreChange={ x => this.setState({totalScore: x}) }
                />

                {/* <Timer/> */}
                <ToastContainer/>
            </div>
        );
    }
}

export {
    GameBoard,
    ScoreBoard
}