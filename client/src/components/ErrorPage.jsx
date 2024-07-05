import { useRouteError, Link } from "react-router-dom";

function ErrorPage() {
    const error = useRouteError();
    return(
        <div>
            <h1>ERROR. PAGE DOESNT EXIST.</h1>
        </div>
    )
}

export default ErrorPage;