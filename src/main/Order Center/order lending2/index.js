import { Link } from "react-router-dom";
export default function OrderLending2() {
        return(
            <div className="container">
            <div className="card">
              <div className="card-body ">
                <div className="d-flex">
                    <Link to="/OrderLending">
                    <p>Failed Loans Order</p>
                    </Link>
                    <Link to="/OrderLending2">
                
                <p style={{marginLeft:"10%"}}>Withdrawal order</p>
                </Link>

                </div>
               
              {/* <button type="button" className="btn btn-primary">
                    Assign Cases
                  </button> */}
                  <hr />
                <div className="input-group mb-3" >
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="User ID"
                    aria-label="User ID"
                  />
      
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Order ID"
                    aria-label="Server" 
                  />
                   <input
                    type="text"
                    className="form-control"
                    placeholder="Phone Number"
                    aria-label="Server" 
                  />
                               
                     <input
                    type="date"
                    className="form-control"
                    placeholder="date"
                    aria-label="Server" 
                  />
                <button type="button" className="btn btn-primary">
                    Search
                  </button>
                  <button type="button" className="btn btn-default">
                    Reset
                  </button>
                 
                </div>
                <div className="card-body">
                  <div className="input-group mb-3">
                 
                  </div>
        {/* table here  */}
     <table className="table">
      <thead>
        <tr>
          <th scope="col">Order ID</th>
          <th scope="col">Three-Part-Serial No.</th>
          <th scope="col">User ID</th>
          <th scope="col">Username</th>
          <th scope="col">Phone Number</th>
          <th scope="col">Loan Type</th>
          <th scope="col">Lending Amount</th>
          <th scope="col">ID Number</th>
          <th scope="col">Applied Time</th>
          <th scope="col">Failure Reason</th>
          <th scope="col">Operation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">2304</th>
          <td>1204</td>
          <td>172</td>
          <td>Prince</td> 
          <td>0243984046</td>
          <td>first-loan</td>
          <td>120</td>
          <td>GHA-2222222222-2</td>
          <td>2022-08-12 17:42:20</td>
          <td>not enough funds</td>
          <td>.....</td>
           
        </tr>
      </tbody>
    </table>
    
      </div>
              </div>
            </div>
          </div>
        )
        
    } 
