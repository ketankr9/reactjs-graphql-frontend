import { gql } from "apollo-boost";

export const QueryGetAllUsersSorted = gql`
query {
    users: getTopNUsers {
        id
        score
        name
    }
}`;

export const QueryGetTopNUsers = gql`
query getTopNUsers($count: Int){
    users: getTopNUsers(count: $count){
        id
        score
        name
    }
}`;

export const QueryGetAllUsers = gql`
{
    users: getAllUsers {
    id
    score
    name
    }
}`;

export const QueryGetUserById = gql`
query getUserById($id: ID!) {
    user: getUserById(id: $id){
        score
    }
}`;

// MUTATIONS
export const UPDATE_USER = gql`
mutation updateUser($id: ID!, $score: Int!){
    user: updateUser(id: $id, score: $score){
        id
        name
        score
    }
}
`;

export const CREATE_USER = gql`
mutation createUser($name: String!){
    user: createUser(name: $name){
        id
        name
        score
    }
}
`;