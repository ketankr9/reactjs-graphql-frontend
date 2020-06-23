import React from 'react';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ApolloProvider, Query, Mutation } from "react-apollo";
import ApolloClient from "apollo-boost";

import {CREATE_USER, UPDATE_USER, QueryGetAllUsersSorted} from './Queries';

// const log = (st) => console.log(st);

const getLocalStorage = () => {
    let ret = {};
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
    localStorage.setItem("gameXYZstate", JSON.stringify(newLocalState));
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
              <h3>Live Score Board</h3>
              <Query query={QueryGetAllUsersSorted}>
                {props => {
                    const { error, loading, data } = props;
                    if (error) return <div>*ERROR*: {JSON.stringify(error)}</div>;
                    if (loading) return <div>*LOADING*...</div>;
                    if (!data && !data.users) return <div>No Books Found!</div>;
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
            currentScore: this.props.restoredState.currentScore || 0,
            // maxScore: this.props.restoredState.maxScore || 0,
            name: this.props.restoredState.name,
            id: this.props.restoredState.id,
            score: this.props.restoredState.score
        }
    }

    getPoints(){
        return this.state.currentScore;
    }

    updateLocalStorage(){
        setLocalStorage(this.state);
        this.props.onUpdateUserScore(this.state.score)
    }

    incrementScore(i){
        const newScore = this.state.currentScore+i;
        this.setState({
            currentScore: newScore
        }, () => this.updateLocalStorage() );
    }

    render(){
        return (
            <div>
                <div>
                    <label>Current Value</label>:<input readOnly={true} value={this.state.currentScore}/>
                </div>
                <div>
                    <button onClick={ () => this.incrementScore(+1) }>+</button>
                    {/* <button onClick={ () => this.incrementScore(-1) }>-</button> */}
                    <ApolloProvider client={client}>
                    <Mutation mutation={UPDATE_USER}
                        onCompleted={(data)=> {
                            // console.log(data);
                            window.location.reload();
                            toast(`🦄 Your earned ${this.getPoints()} new points`);
                            this.setState({maxScore: 0, currentScore: 0, score: data.user.score}, () => this.updateLocalStorage())
                        }}
                        variables = {{id: this.state.id, score: this.getPoints()}}>
                            {updateUser => <button onClick={updateUser}>Collect</button> }  
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
            <div><i>Time elapsed</i>: {this.state.timeElapsed} seconds</div>
        );
    }
}

class GameBoard extends React.Component {
    constructor(props){
        super(props)

        const restoredState = getLocalStorage();
        console.log(restoredState);
        this.state = {
            restoredState: restoredState,
            tmpName: null
        }
    }

    updateNameState(event){
        this.setState({
            tmpName : event.target.value,
        });
    }

    render(){
        if(!this.state.restoredState.name){
            return(
                <div>
                    <h1>Game</h1>
                    <input type="text" name="name" value={this.state.restoredState.name} onChange={ this.updateNameState.bind(this) }/>
                    <ApolloProvider client={client}>
                    <Mutation mutation={CREATE_USER}
                        onCompleted={(data) => { this.setState({ restoredState: data.user }, () => setLocalStorage(this.state.restoredState)); } }
                        variables = {{name: this.state.tmpName}}>
                            {createUser => <button onClick={createUser}>Set Name</button> }  
                    </Mutation>
                    </ApolloProvider>
                </div>
            );
        }
        
        return(
            <div>
                <Timer/>
                <h1>Game</h1>
                <label>Welcome <b>{this.state.restoredState.name} </b> </label> <br/>
                <label key={this.state.restoredState.id}> Total Score: <b>{this.state.restoredState.score | 0}</b> </label>
                <br/><br/><br/>
                <Game 
                    restoredState={this.state.restoredState} onUpdateUserScore={ (x) => { 
                        const restoredState = this.state.restoredState;
                        restoredState.score = x;
                        this.setState({restoredState: restoredState});
                    } } 
                />
                <ToastContainer/>
            </div>
        );
    }
}

export {
    GameBoard,
    ScoreBoard
}