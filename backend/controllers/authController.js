import express from "express";
import { createUser,findUserbyEmail } from "../models/userModel.js";
import jwt  from "jsonwebtoken";
 import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();


export const signup = async (req,res)=>{
    const {email,password} = req.body;
    const existingUser = await findUserbyEmail(email)
    if(existingUser){
        return res.status(400).json({error:"User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const user = await createUser(email,hashedPassword);
    res.json({user})
}

export const login= async(req,res)=>{
    const {email,password}=req.body
    const user = await findUserbyEmail(email);
    if(!user){
        return res.status(400).json({error:"Invalid credentials"});
    }   
    const valid = await bcrypt.compare(password,user.password)
    if(!valid){
        return res.status(400).json({error:"Invalid credentials"});
    }
    console.log("SECRET AT SIGNING:", `"${process.env.JWT_SECRET}"`);
    const token = jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:'1h'});
    res.json({token});
}