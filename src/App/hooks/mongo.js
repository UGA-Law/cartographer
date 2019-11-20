import { useState, useEffect } from 'react'
import { getMongoClient } from '../../Utilities/getMongoClient.js'

export const useMongoClient = () => {
  const [ client, setClient ] = useState(null)
  const [ isConnected, setIsConnected ] = useState(false)

  useEffect(() => {
    const mongoClient = getMongoClient()
    setClient(mongoClient)
    mongoClient.connect().then(() => {
      setIsConnected(true)
    })
    return () => {
      mongoClient.close()
    }
  }, [])

  return {
    client,
    isConnected
  }
}

export const useMongoDataOne = ({ filter, collectionName, dbName, isEnabled = true }) => {
  const [result, setResult] = useState(null)
  const [isWorking, setIsWorking] = useState(false)
  const { client, isConnected } = useMongoClient()

  useEffect(() => {
    if (client && isConnected && isEnabled) {
      setIsWorking(true)
      setTimeout(() => {
        client.db(dbName)
          .collection(collectionName).findOne(filter).then((result) => {
            setResult(result)
            setIsWorking(false)
          })
      }, Math.random() * 100)
    }
  }, [client, isConnected, isEnabled])

  return {
    result,
    isWorking
  }
}

export const useMongoDataMany = ({
  dbName,
  collectionName,
  filter,
  limit,
  skip
}) => {
  const [ results, setResults ] = useState([])
  const [ isWorking, setIsWorking ] = useState(null)
  const { client, isConnected } = useMongoClient()

  useEffect(() => {
    if (client && isConnected) {
      setIsWorking(true)
      client.db(dbName)
        .collection(collectionName)
        .find({ ...filter })
        .skip(skip)
        .limit(limit)
        .toArray()
        .then(results => {
          setIsWorking(false)
          setResults(results)
        })
    }
  }, [
    isConnected,
    dbName,
    collectionName,
    filter,
    limit,
    skip
  ])

  return {
    isWorking,
    isConnected,
    results
  }
}
