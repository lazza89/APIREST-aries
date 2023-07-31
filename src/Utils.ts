export class UniversityCredentialsContainer{
    constructor(name = "Fanco", degree = "Filosofia", date = "in corso"){
        this._name = name;
        this._degree = degree;
        this._date = date;
    }
    public _name: string;
    public _degree: string;
    public _date: string;
}